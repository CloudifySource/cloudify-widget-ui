/**
 * Created by sefi on 22/01/15.
 */
'use strict';
var logger = require('log4js').getLogger('AbstractWidgetExecutor');
var async = require('async');
var managers = require('../managers');
var path = require('path');
var _ = require('lodash');
var conf = require('../Conf');


function AbstractWidgetExecutor(executionModel) {
    logger.info('ctor');
    this.executionModel = executionModel;
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

//--------------------- TASKS -----------------------
AbstractWidgetExecutor.prototype.getWidget = function (executionModel, callback) {
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
            callback(null, executionModel);
            done();
        });
    });
};

AbstractWidgetExecutor.prototype.updateExecutionModel = function (data, executionModel, callback) {
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

AbstractWidgetExecutor.prototype.updateExecutionModelAddPaths = function (executionModel, callback) {
    logger.info('updating execution model add paths');

    executionModel.setExecutionId(executionModel.getExecutionObjectId().toHexString());
    executionModel.setDownloadsPath(path.join(conf.downloadsDir, executionModel.getExecutionId()));
    executionModel.setLogsPath(path.join(conf.logsDir, executionModel.getExecutionId()));

    this.updateExecutionModel({
        downloadsPath: executionModel.getDownloadsPath(),
        logsPath: executionModel.getLogsPath()
    }, executionModel, callback);
};

//--------------------- TASKS END -----------------------

AbstractWidgetExecutor.prototype.playFinally = function (err, executionModel) {

};

/**
 * The template function for the execution.
 *
 * @param executionModel
 */
AbstractWidgetExecutor.prototype.play = function (executionModel) {
    logger.info('Executing ' + this.executionType);
    logger.info('playing widget id: ' + executionModel.getWidgetId());

    function init(callback) {
        callback(null, executionModel);
    }

    var tasks = [init];
    var executionTasks = this.getExecutionTasks();
    tasks = tasks.concat(executionTasks);

    async.waterfall(tasks, this.playFinally);

};

module.exports = AbstractWidgetExecutor;

