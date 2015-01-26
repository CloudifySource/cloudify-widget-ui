/**
 * Created by sefi on 26/01/15.
 */
'use strict';

var logger = require('log4js').getLogger('TasksDirectory');
var managers = require('../managers');
var services = require('../services');
var path = require('path');
var _ = require('lodash');
var conf = require('../Conf');
var models = require('../models');

//---------------- COMMON TASKS ------------------------

exports.getWidget = function (executionModel, callback) {
    logger.info('getting widget id ' + executionModel.getWidgetId());

    managers.db.connect('widgets', function (db, collection, done) {
        collection.findOne({ _id: executionModel.getWidgetObjectId()}, function (err, result) {
            if (err) {
                logger.error('unable to find widget', err);
                callback(err, executionModel);
                done();
                return;
            }

            if (!result) {
                logger.error('result is null for widget find');
                callback(new Error('could not find widget'), executionModel);
                done();
                return;
            }

            executionModel.setWidget(result);
            callback(null, executionModel);
            done();
        });
    });
};

exports.saveExecutionModel = function (executionModel, callback) {
    logger.info('saving execution to mongo');

    managers.db.connect('widgetExecutions', function (db, collection, done) {
        // instantiate the execution model with the widget data, and remove the _id - we want mongodb to generate a unique id
        var storedExecutionModel = {};
        storedExecutionModel.widget = executionModel.getWidget();
        storedExecutionModel.loginDetailsId = executionModel.getLoginDetailsId();
        storedExecutionModel.state = 'RUNNING';

        collection.insert(storedExecutionModel, function (err, docsInserted) {
            if (err) {
                logger.error('failed to store widget execution model to DB', err);
                callback(err, executionModel);
                done();
                return;
            }

            if (!docsInserted) {
                logger.error('no widget execution docs inserted to database');
                callback(new Error('no widget execution docs inserted to database'), executionModel);
                done();
                return;
            }

            executionModel.setExecutionObjectId(docsInserted[0]._id);
            callback(null, executionModel);
            done();
        });
    });
};

exports.updateExecutionModel = function (data, executionModel, callback) {
    managers.db.connect('widgetExecutions', function (db, collection, done) {
        collection.findOne(
            { _id: executionModel.getExecutionObjectId() },
            function (err, result) {
                if (err) {
                    logger.error('failed to retrieve execution model before update', err);
                    callback(err, executionModel);
                    done();
                    return;
                }

                result = _.merge(result, data);

                collection.update(
                    { _id: executionModel.getExecutionObjectId() },
                    result,
                    function (err, nUpdated) {
                        if (err) {
                            logger.error('failed updating widget execution model', err);
                            callback(err, executionModel);
                            done();
                            return;
                        }

                        if (!nUpdated) {
                            logger.error('no widget execution docs updated in the database');
                            callback(new Error('no widget execution docs updated in the database'), executionModel);
                            done();
                            return;
                        }

                        callback(null, executionModel);
                        done();
                    });
            });
    });
};

exports.updateExecutionModelAddPaths = function (executionModel, callback) {
    logger.info('updating execution model add paths');

    executionModel.setExecutionId(executionModel.getExecutionObjectId().toHexString());
    executionModel.setDownloadsPath(path.join(conf.downloadsDir, executionModel.getExecutionId()));
    executionModel.setLogsPath(path.join(conf.logsDir, executionModel.getExecutionId()));

    exports.updateExecutionModel({
        downloadsPath: executionModel.getDownloadsPath(),
        logsPath: executionModel.getLogsPath()
    }, executionModel, callback);
};

exports.downloadRecipe = function(executionModel, callback) {
    // TODO : add validation if destination download not already exists otherwise simply call callback.
    logger.info('downloading recipe from ', executionModel.getWidget().recipeUrl);
    // download recipe zip
    var options = {
        destDir: executionModel.getDownloadsPath(),
        url: executionModel.getWidget().recipeUrl,
        extract: true
    };

    if (!options.url) {
        executionModel.setShouldInstall(false);
        callback(null, executionModel);

    } else {
        executionModel.setShouldInstall(true);
        services.dl.downloadZipfile(options, function (e) {
            callback(e, executionModel);
        });
    }
};

exports.sendEmailAfterInstall = function(executionModel) {
    var widget = executionModel.getWidget();

    if (!widget.socialLogin || !widget.socialLogin.handlers || !widget.socialLogin.handlers.mandrill || !widget.socialLogin.handlers.mandrill.enabled) {
        // noop
        return;
    }

    var mandrillConfig = widget.socialLogin.handlers.mandrill;
    var publicIp = executionModel.getNodeModel().machineSshDetails.publicIp;
    var link = '<a href="http://"' + publicIp + '> http://' + publicIp + '</a>';

    managers.widgetLogins.getWidgetLoginById(executionModel.getLoginDetailsId(), function (err, result) {
        if (err) {
            logger.error('unable to find login details, email send failed', err);
            return;
        }

        if (!result) {
            logger.error('result is null for login details find, email send failed');
            return;
        }

        var fullname = result.loginDetails.name + ' ' + result.loginDetails.lastName;

        var data = {
            'apiKey': mandrillConfig.apiKey,
            'template_name': mandrillConfig.templateName,
            'template_content': [
                {
                    'name': 'link',
                    'content': link
                },
                {
                    'name': 'name',
                    'content': fullname
                },
                {
                    'name': 'randomValue',
                    'content': executionModel.getNodeModel().randomValue
                },
                {
                    'name': 'publicIp',
                    'content': publicIp
                }
            ],
            'message': {
                'to': [
                    {
                        'email': result.loginDetails.email,
                        'name': fullname,
                        'type': 'to'
                    }
                ]
            },
            'async': true
        };

        services.mandrill.sendMandrillTemplate(data,
            function (err, result) {
                if (err) {
                    executionModel.getWidget().socialLogin.handlers.mandrill.status = err;
                } else {
                    executionModel.getWidget().socialLogin.handlers.mandrill.status = result;
                }
            });
    });
};

//---------------- COMMON TASKS END ------------------------

//---------------- FREE TASKS ------------------------

exports.getPoolKey = function (executionModel, callback) {
    logger.info('getting pool key');

    managers.db.connect('users', function (db, collection) {
        collection.findOne({ '_id': executionModel.getWidget().userId }, function (err, result) {
            if (err) {
                logger.error('unable to find user from widget', err);
                callback(err, executionModel);
                return;
            }

            if (!result) {
                logger.error('result is null for widget');
                callback(new Error('could not find user for widget'), executionModel);
                return;
            }

            logger.info('found poolKey', result.poolKey);
            executionModel.setPoolKey(result.poolKey);
            callback(null, executionModel);
        });
    });
};

exports.occupyMachine = function(executionModel, callback) {
    logger.info('occupying machine');

    // TODO better defense
    var expires = Date.now() + ( ( executionModel.getWidget().installTimeout || 20 ) * 60 * 1000); //  default to 20 minutes
    logger.info('installation will expire within [%s] minutes - at [%s], or [%s] epoch time', executionModel.getWidget().installTimeout, Date(expires), expires);

    managers.poolClient.occupyPoolNode(executionModel.getPoolKey(), executionModel.getWidget().poolId, expires, function (err, result) {

        if (err) {
            logger.error('occupy node failed');
            callback(err, executionModel);
            return;
        }

        if (!result) {
            logger.error('occupy node result is null');
            callback(new Error('We\'re so hot, that all machines are occupied! Please try again in a few minutes.'), executionModel);
            return;
        }

        var resultObj = result; // todo: callbackWrapper makes this obsolete
        if (typeof result === 'string') {
            try {
                resultObj = JSON.parse(result);
            } catch (e) {
                callback(e, executionModel);
            }
        }

        executionModel.setNodeModel(resultObj);
        callback(null, executionModel);
    });
};

exports.updateExecutionModelAddNodeModel = function(executionModel, callback) {
    logger.info('update Execution Model Add Node Model');

    exports.updateExecutionModel({
        nodeModel: executionModel.getNodeModel()
    }, executionModel, callback);
};

exports.runInstallCommand = function(executionModel, callback) {
    logger.info('running Install Command');

    if (!executionModel.getShouldInstall()) {
        var status = {'code': 0};

        services.logs.writeStatus(JSON.stringify(status, null, 4) + '\n', executionModel.getExecutionId());
        services.logs.appendOutput('Install finished successfully.\n', executionModel.getExecutionId());

        exports.sendEmailAfterInstall(executionModel);

        callback(null, executionModel);
        return;
    }

    // else -> executionModel.getShouldInstall() = true

    var installPath = executionModel.getDownloadsPath();
    if (executionModel.getWidget().recipeRootPath) {
        try {
            installPath = path.join(executionModel.getDownloadsPath(), executionModel.getWidget().recipeRootPath || ' ');
        } catch (e) {
            callback(new Error('failed while joining install path, one or more of the parameters is not a string: [' +
            executionModel.getDownloadsPath() + '] [' + executionModel.getWidget().recipeRootPath + ']'), executionModel);
            return;
        }
    }

    var command = {
        arguments: [
            'connect',
            executionModel.getNodeModel().machineSshDetails.publicIp,
            ';',
            models.recipeType.getById(executionModel.getWidget().recipeType).installCommand,
            installPath
        ],
        logsDir: executionModel.getLogsPath(),
        executionId: executionModel.getExecutionObjectId().toHexString()
    };

    // we want to remove the execution model when the execution is over
    services.cloudifyCli.executeCommand(command, function (exErr/*, exResult*/) {
        if (exErr) {
            logger.error('error while running install from cli', exErr);
            return;
        }

        exports.sendEmailAfterInstall(executionModel);
        // TODO change execution status
    });

    callback(null, executionModel);
};

//---------------- FREE TASKS END ------------------------


//---------------- SOLO TASKS ------------------------


//---------------- SOLO TASKS END ------------------------

