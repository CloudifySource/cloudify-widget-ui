/**
 * Created by sefi on 22/01/15.
 */
'use strict';

var util = require('util');
var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');
var tasksDirectory = require('./TasksDirectory');
var logger = require('log4js').getLogger('FreeWidgetExecutor');

function FreeWidgetExecutor(executionModel) {
    logger.info('ctor');
    AbstractWidgetExecutor.call(this, executionModel);
}

util.inherits(FreeWidgetExecutor, AbstractWidgetExecutor);

//-----------  Overrides  ----------------------
FreeWidgetExecutor.prototype.executionType = 'Free';

AbstractWidgetExecutor.prototype.getExecutionTasks = function () {
    return [
        tasksDirectory.getWidget,
        tasksDirectory.getPoolKey,
        tasksDirectory.saveExecutionModel,
        tasksDirectory.updateExecutionModelAddPaths
    ];
};

//-----------  Overrides END ----------------------


module.exports = FreeWidgetExecutor;
