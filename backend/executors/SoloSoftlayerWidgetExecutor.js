/**
 * Created by sefi on 28/01/15.
 */
'use strict';

var util = require('util');
var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');
var tasksDirectory = require('./TasksDirectory');

function SoloSoftlayerWidgetExecutor() {
    AbstractWidgetExecutor.call(this);
}

util.inherits(SoloSoftlayerWidgetExecutor, AbstractWidgetExecutor);

//-----------  Overrides  ----------------------

SoloSoftlayerWidgetExecutor.prototype.executionType = 'Solo Softlayer';

SoloSoftlayerWidgetExecutor.prototype.getExecutionTasks = function () {
    return [
        tasksDirectory.soloSoftlayer.soloSoftlayerInit,
        tasksDirectory.common.getWidget,
        tasksDirectory.common.saveExecutionModel,
        //tasksDirectory.soloSoftlayer.setupVirtualenv,
        tasksDirectory.soloSoftlayer.setupDirectory,
        tasksDirectory.soloSoftlayer.setupEnvironmentVariables,
        tasksDirectory.soloSoftlayer.setupSoftlayerCli,
        tasksDirectory.soloSoftlayer.setupSoftlayerSsh,
        tasksDirectory.soloSoftlayer.editInputsFile,
        tasksDirectory.soloSoftlayer.runInitCommand,
        tasksDirectory.soloSoftlayer.runInstallWorkflowCommand
    ];
};

//-----------  Overrides END ----------------------


module.exports = SoloSoftlayerWidgetExecutor;
