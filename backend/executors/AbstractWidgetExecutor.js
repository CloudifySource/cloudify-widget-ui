/**
 * Created by sefi on 22/01/15.
 */
'use strict';
var logger = require('log4js').getLogger('AbstractWidgetExecutor');
var async = require('async');
var managers = require('../managers');

function AbstractWidgetExecutor() {
    logger.info('ctor');
    //this.executionModel = executionModel;
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

AbstractWidgetExecutor.prototype.updateExecution = function (executionObjectId, data) {
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
        logger.info('failed to play widget with id [%s]', executionModel.getWidgetId());
        this.updateExecution(executionModel.getExecutionObjectId(), {
            state: 'STOPPED',
            error: err.message
        });
        executionModel.getExecutionCallback()(err, executionModel.getExecutionId());
        return;
    }

    logger.info('finished widget execution!');
    executionModel.getExecutionCallback()(null, executionModel.getExecutionObjectId().toHexString());
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

module.exports = AbstractWidgetExecutor;

