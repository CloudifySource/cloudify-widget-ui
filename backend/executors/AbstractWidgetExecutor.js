/**
 * Created by sefi on 22/01/15.
 */
'use strict';
/*jshint unused:false */

var logger = require('log4js').getLogger('AbstractWidgetExecutor');
var async = require('async');
var managers = require('../managers');
var services = require('../services');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');

function AbstractWidgetExecutor() {
    logger.info('ctor');
}

AbstractWidgetExecutor.prototype.executionModel;

/**
 * <b>Abstract. Should be overridden by extending classes.</b>
 * The execution type.
 * @type {string}
 */
AbstractWidgetExecutor.prototype.executionType;

/**
 * <b>Abstract. Should be overridden by extending classes.</b>
 *
 * @returns {Array} The waterfall tasks
 */
AbstractWidgetExecutor.prototype.getExecutionTasks = function () {
    throw new Error('Abstract method not implemented in inheriting class!');
};

AbstractWidgetExecutor.prototype.getCloudPropertiesUpdateLineInner = function (executionDetails, executionId) {
    return '';
};

var updateExecution = function (executionObjectId, data) {
    managers.db.connect('widgetExecutions', function (db, collection, done) {
        collection.update(
            {_id: executionObjectId},
            {
                $set: data
            },
            function (err, nUpdated) {
                if (!!err) {
                    logger.error('failed updating widget execution model', err);
                    done();
                    return;
                }
                if (!nUpdated) {
                    logger.error('no widget execution docs updated in the database');
                    done();
                    return;
                }
                done();
            });
    });
};

AbstractWidgetExecutor.prototype.playFinally = function (err, executionModel) {
    if (err) {
        logger.info('failed to play widget with id [%s]', executionModel.getWidgetId(), err.message);
        updateExecution(executionModel.getExecutionObjectId(), {
            state: 'STOPPED',
            error: err.message
        });
        executionModel.getExecutionCallback()(err, executionModel.getExecutionId());
        return;
    }

    logger.info('finished widget execution!');
    executionModel.getExecutionCallback()(null, executionModel.getExecutionId());
};

/**
 * The template function for the execution.
 *
 * @param executionModel
 */
AbstractWidgetExecutor.prototype.play = function (executionModel) {
    logger.info('Executing ' + this.executionType);
    this.executionModel = executionModel;
    logger.info('playing widget id: ' + executionModel.getWidgetId());

    function playInit(callback) {
        callback(null, executionModel);
    }

    var tasks = [playInit];
    var executionTasks = this.getExecutionTasks();
    tasks = tasks.concat(executionTasks);

    async.waterfall(tasks, this.playFinally);

};

//-----------  Common tasks  ----------------------
AbstractWidgetExecutor.prototype.sendEmailAfterInstall = function(executionModel) {
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

AbstractWidgetExecutor.prototype.getRecipePropertiesUpdateLine = function (executionDetails) {
    var updateLine = '';

    if (executionDetails.recipeProperties) {
        for (var i = 0; i < executionDetails.recipeProperties.length; i++) {
            var prop = executionDetails.recipeProperties[i];

            if (_.isNumber(prop.value)) {
                updateLine += prop.key + '=' + prop.value + '\n';
            } else {
                updateLine += prop.key + '="' + prop.value + '"\n';
            }
        }
    }

    return updateLine;
};

AbstractWidgetExecutor.prototype.getCloudPropertiesUpdateLine = function (executionDetails, executionId) {
    var updateLine = this.getCloudPropertiesUpdateLineInner(executionDetails, executionId);
    updateLine += this.getRecipePropertiesUpdateLine(executionDetails);

    return updateLine;
};

AbstractWidgetExecutor.prototype.updatePropertiesFile = function (fileName, updateLine, callback) {
    logger.info('---updateLine', updateLine);
    fs.appendFile(fileName, updateLine, callback);
};

AbstractWidgetExecutor.prototype.getWidget = function (executionModel, callback) {
    logger.info('getting widget id ' + executionModel.getWidgetId());

    managers.db.connect('widgets', function (db, collection, done) {
        collection.findOne({_id: executionModel.getWidgetObjectId()}, function (err, result) {
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

AbstractWidgetExecutor.prototype.saveExecutionModel = function (executionModel, callback) {
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
            executionModel.setExecutionId(executionModel.getExecutionObjectId().toHexString());
            callback(null, executionModel);
            done();
        });
    });
};

AbstractWidgetExecutor.prototype.updateExecutionModel = function (data, executionModel, callback) {
    managers.db.connect('widgetExecutions', function (db, collection, done) {
        collection.findOne(
            {_id: executionModel.getExecutionObjectId()},
            function (err, result) {
                if (err) {
                    logger.error('failed to retrieve execution model before update', err);
                    callback(err, executionModel);
                    done();
                    return;
                }

                result = _.merge(result, data);

                collection.update(
                    {_id: executionModel.getExecutionObjectId()},
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

AbstractWidgetExecutor.prototype.updateExecutionModelAddPaths = function (executionModel, callback) {
    logger.info('updating execution model add paths');

    executionModel.setDownloadsPath(path.join(conf.downloadsDir, executionModel.getExecutionId()));
    executionModel.setLogsPath(path.join(conf.logsDir, executionModel.getExecutionId()));

    this.updateExecutionModel({
        downloadsPath: executionModel.getDownloadsPath(),
        logsPath: executionModel.getLogsPath()
    }, executionModel, callback);
};

AbstractWidgetExecutor.prototype.downloadRecipe = function (executionModel, callback) {
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

AbstractWidgetExecutor.prototype.downloadCloudProvider = function (executionModel, callback) {
    // TODO : add validation if destination download not already exists otherwise simply call callback.
    logger.info('downloading Cloud Provider from ', executionModel.getExecutionDetails().providerUrl);

    var options = {
        destDir: executionModel.getDownloadsPath(),
        url: executionModel.getExecutionDetails().providerUrl,
        extract: true
    };

    services.dl.downloadZipfile(options, function (e) {
        callback(e, executionModel);
    });

};

AbstractWidgetExecutor.prototype.overrideRecipePropertiesFile = function (executionModel, callback) {
    logger.trace('overriding Recipe Properties File');

    var widget = executionModel.getWidget();
    var recipeDistFolderName = executionModel.getDownloadsPath() + path.sep + widget.recipeRootPath;
    executionModel.setRecipeDistFolderName(recipeDistFolderName);
    // filename - assuming that the file format is 'recipeName'-'recipeType'.properties i.e. mongod-service.properties
    var recipePropertiesFile = recipeDistFolderName + path.sep + widget.recipeName + '-' + widget.recipeType + '.properties';
    var executionDetails = executionModel.getExecutionDetails();
    var updateLine = this.getRecipePropertiesUpdateLine(executionDetails);

    this.updatePropertiesFile(recipePropertiesFile, updateLine, function (err) {
        if (err) {
            logger.info(err);
            callback(err, executionModel);
            return;
        }

        logger.info('Recipe Properties File was updated:', recipePropertiesFile);
        callback(null, executionModel);
    });

};


//-----------  Common tasks end ----------------------


module.exports = AbstractWidgetExecutor;

