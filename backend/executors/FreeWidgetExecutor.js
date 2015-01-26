/**
 * Created by sefi on 22/01/15.
 */
'use strict';

var util = require('util');
var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');
var logger = require('log4js').getLogger('FreeWidgetExecutor');
var managers = require('../managers');

function FreeWidgetExecutor(executionModel) {
    logger.info('ctor');
    AbstractWidgetExecutor.call(this, executionModel);
}

util.inherits(FreeWidgetExecutor, AbstractWidgetExecutor);

//--------------------- TASKS -----------------------
FreeWidgetExecutor.prototype.getPoolKey = function (executionModel, callback) {
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

//--------------------- TASKS END -----------------------

//-----------  Overrides  ----------------------
FreeWidgetExecutor.prototype.executionType = 'Free';

AbstractWidgetExecutor.prototype.getExecutionTasks = function () {
    return [
        this.getWidget,
        this.getPoolKey,
        this.saveExecutionModel
    ];
};
//-----------  Overrides  ----------------------


module.exports = FreeWidgetExecutor;
