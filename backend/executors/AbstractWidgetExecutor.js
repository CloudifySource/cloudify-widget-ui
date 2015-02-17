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
var conf = require('../Conf');

function AbstractWidgetExecutor() {
    logger.info('ctor');
}

/**
 * The execution model.
 * Executor uses the execution model to store the state of the execution. Some of the data in the execution model
 * is stored in the DB.
 */
AbstractWidgetExecutor.prototype.executionModel;

/**
 * <b>Abstract. Should be overridden by extending classes.</b>
 * The execution type.
 * @type {string}
 */
AbstractWidgetExecutor.prototype.executionType;

/**
 * <b>Abstract. Should be overridden by extending classes.</b>
 * It returns an array of references to task functions.
 * tasks functions accept executionModel and callback as arguments.
 *
 * @returns {Array} The waterfall tasks array
 */
AbstractWidgetExecutor.prototype.getExecutionTasks = function () {
    throw new Error('Abstract method not implemented in inheriting class!');
};

/**
 * Returns a string that is the value that needs to be added to the cloud properties file.
 * The default implementation is to return an empty string ('').
 * Extending executors can override this with specific implementations.
 *
 * @param executionDetails  The executionDetails
 * @param executionId   The executionId
 * @returns {string}    The updateLine to be used.
 */
AbstractWidgetExecutor.prototype.getCloudPropertiesUpdateLineInner = function (executionDetails, executionId) {
    return '';
};

AbstractWidgetExecutor.prototype.getSendMailTemplateExtraContent = function (executionModel) {
    return [];
};

function updateExecution (executionObjectId, data) {
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
}

/**
 * Store the execution model in the DB. This creates a new document in widgetExecutions in the DB.
 *
 * @param executionModel
 * @param callback
 */
function saveExecutionModel (executionModel, callback) {
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
                callback(err);
                done();
                return;
            }

            if (!docsInserted) {
                logger.error('no widget execution docs inserted to database');
                callback(new Error('no widget execution docs inserted to database'));
                done();
                return;
            }

            executionModel.setExecutionObjectId(docsInserted[0]._id);
            executionModel.setExecutionId(executionModel.getExecutionObjectId().toHexString());
            callback();
            done();
        });
    });
}

/**
 * After all the execution tasks have completed their execution, this method is run to clean up and
 * call the provided callback.
 *
 * @param err
 * @param executionModel
 */
AbstractWidgetExecutor.prototype.playFinally = function (err, executionModel) {
    if (err) {
        services.logs.appendOutput('failed to play widget with id ' + executionModel.getWidgetId(), executionModel.getExecutionId());
        services.logs.appendOutput(err.message, executionModel.getExecutionId());
        logger.info('failed to play widget with id [%s]', executionModel.getWidgetId(), err.message);
        updateExecution(executionModel.getExecutionObjectId(), {
            state: 'STOPPED',
            error: err.message
        });
        executionModel.getExecutionCallback()(err, executionModel.getExecutionId());
        return;
    }

    logger.info('finished widget execution!');
    services.logs.appendOutput('\nfinished widget execution!', executionModel.getExecutionId());
};

/**
 * The template function for the execution.
 * This is the method that kicks the execution code. It initializes and executes the waterfall code.
 *
 * @param executionModel
 */
AbstractWidgetExecutor.prototype.play = function (executionModel) {
    logger.info('Executing ' + this.executionType);
    this.executionModel = executionModel;
    logger.info('playing widget id: ' + executionModel.getWidgetId());
    var that = this;

    // save execution model
    saveExecutionModel(executionModel, function(err) {
        if (err) {
            logger.info('execution model failed. ', err);
            executionModel.getExecutionCallback()(err);
            return;
        }

        logger.info('execution model saved, id: ' + executionModel.getExecutionId());

        // call execution callback - so that widget polling can start.
        executionModel.getExecutionCallback()(null, executionModel.getExecutionId());

        // define waterfall
        function playInit(callback) {
            callback(null, executionModel);
        }

        var tasks = [playInit];
        var executionTasks = that.getExecutionTasks();
        tasks = tasks.concat(executionTasks);

        // execute waterfall
        async.waterfall(tasks, that.playFinally);
    });
};

//-----------  Common tasks  ----------------------

/**
 * A util function that facilitates sending an email using mandrill when the execution is complete.
 * The email recipient is derived from the social login performed prior to the execution. If such a social login is not
 * present, no email will be sent.
 *
 * @param executionModel
 */
AbstractWidgetExecutor.prototype.sendEmailAfterInstall = function(executionModel) {
    var widget = executionModel.getWidget();

    if (!widget.socialLogin || !widget.socialLogin.handlers || !widget.socialLogin.handlers.mandrill || !widget.socialLogin.handlers.mandrill.enabled) {
        // noop
        return;
    }

    var mandrillConfig = widget.socialLogin.handlers.mandrill;
    var publicIp = executionModel.getNodeModel().machineSshDetails.publicIp;
    var that = this;

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
        var templateContent = [
            {
                'name': 'link',
                'content': '<a href="http://"' + publicIp + '> http://' + publicIp + '</a>'
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
        ];

        templateContent = templateContent.concat(that.getSendMailTemplateExtraContent(executionModel));

        var data = {
            'apiKey': mandrillConfig.apiKey,
            'template_name': mandrillConfig.templateName,
            'template_content': templateContent,
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

/**
 * Returns the update string to be used for updating the recipe properties file.
 *
 * @param executionDetails
 * @returns {string}
 */
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

/**
 * Returns an update string to be used for updating the cloud properties file.
 * It calls getCloudPropertiesUpdateLineInner internally as well as getRecipePropertiesUpdateLine.
 *
 * @param executionDetails
 * @param executionId
 * @returns {string}
 */
AbstractWidgetExecutor.prototype.getCloudPropertiesUpdateLine = function (executionDetails, executionId) {
    var updateLine = this.getCloudPropertiesUpdateLineInner(executionDetails, executionId);
    updateLine += this.getRecipePropertiesUpdateLine(executionDetails);

    return updateLine;
};

/**
 * Update the provided properties file with the provided update line.
 *
 * @param fileName  The file to be updated
 * @param updateLine    The update string to append to the file
 * @param callback
 */
AbstractWidgetExecutor.prototype.updatePropertiesFile = function (fileName, updateLine, callback) {
    logger.info('---updateLine', updateLine);
    fs.appendFile(fileName, updateLine, callback);
};

/**
 * Retrieve the widget object from DB based on the widgetId provided in the executionModel
 *
 * @param executionModel    The execution model
 * @param callback
 */
AbstractWidgetExecutor.prototype.getWidget = function (executionModel, callback) {
    logger.info('getting widget id ' + executionModel.getWidgetId());
    var that = this;

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
            that.updateExecutionModel({
                widget: result
            }, executionModel, callback);
        });
    });
};

/**
 * Update the execution model stored in the DB.
 *
 * @param data  The update object
 * @param executionModel
 * @param callback
 */
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

/**
 * Add downloads and logs paths to the execution model stored in DB.
 * Calls updateExecutionModel internally.
 *
 * @param executionModel
 * @param callback
 */
AbstractWidgetExecutor.prototype.updateExecutionModelAddPaths = function (executionModel, callback) {
    logger.info('updating execution model add paths');

    executionModel.setDownloadsPath(path.join(conf.downloadsDir, executionModel.getExecutionId()));
    executionModel.setLogsPath(path.join(conf.logsDir, executionModel.getExecutionId()));

    this.updateExecutionModel({
        downloadsPath: executionModel.getDownloadsPath(),
        logsPath: executionModel.getLogsPath()
    }, executionModel, callback);
};

/**
 * Download recipe according to the recipeUrl defined for the widget.
 * If non is defined, nothing will be downloaded.
 *
 * @param executionModel
 * @param callback
 */
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

/**
 * Download cloud provider according to the providerUrl defined for the widget.
 *
 * @param executionModel
 * @param callback
 */
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

/**
 * update recipe properties file based on getRecipePropertiesUpdateLine.
 *
 * @param executionModel
 * @param callback
 */
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

