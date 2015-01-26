/**
 * Created by sefi on 22/01/15.
 */
'use strict';
var logger = require('log4js').getLogger('AbstractWidgetExecutor');
var async = require('async');
var managers = require('../managers');

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

AbstractWidgetExecutor.prototype.getWidget = function (executionModel, callback) {
    logger.info('getting widget id ' + executionModel.getWidgetId());

    managers.db.connect('widgets', function (db, collection, done) {
        collection.findOne({ _id: executionModel.getWidgetObjectId()}, function (err, result) {
            if (err) {
                logger.error('unable to find widget', err);
                callback(err, executionModel);
                return;
            }

            if (!result) {
                logger.error('result is null for widget find');
                callback(new Error('could not find widget'), executionModel);
                return;
            }

            executionModel.setWidget(result);
            callback(null, executionModel);
            done();
        });
    });

    //callback(null, executionModel);
};

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

