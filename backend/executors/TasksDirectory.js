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

//---------------- FREE TASKS END ------------------------


//---------------- SOLO TASKS ------------------------


//---------------- SOLO TASKS END ------------------------

