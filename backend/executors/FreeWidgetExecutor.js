/**
 * Created by sefi on 22/01/15.
 */
'use strict';

var util = require('util');
var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');
var tasksDirectory = require('./TasksDirectory');

function FreeWidgetExecutor() {
    AbstractWidgetExecutor.call(this);
}

util.inherits(FreeWidgetExecutor, AbstractWidgetExecutor);

//-----------  Overrides  ----------------------

FreeWidgetExecutor.prototype.executionType = 'Free';

FreeWidgetExecutor.prototype.getExecutionTasks = function () {
    return [
        tasksDirectory.common.getWidget,
        tasksDirectory.free.getPoolKey,
        tasksDirectory.common.saveExecutionModel,
        tasksDirectory.common.updateExecutionModelAddPaths,
        tasksDirectory.common.downloadRecipe,
        tasksDirectory.free.occupyMachine,
        tasksDirectory.free.updateExecutionModelAddNodeModel,
        tasksDirectory.free.runInstallCommand
    ];
};

//-----------  Overrides END ----------------------


module.exports = FreeWidgetExecutor;
