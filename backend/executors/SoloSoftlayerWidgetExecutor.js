/**
 * Created by sefi on 28/01/15.
 */
'use strict';

var util = require('util');
var path = require('path');
var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');
var tasksDirectory = require('./TasksDirectory');

function SoloSoftlayerWidgetExecutor() {
    AbstractWidgetExecutor.call(this);
}

util.inherits(SoloSoftlayerWidgetExecutor, AbstractWidgetExecutor);

var soloSoftlayerInit = function (executionModel, callback) {
    var executionDetails = executionModel.getExecutionDetails();
    executionDetails = _.merge({'configPrototype': path.resolve(__dirname, '..', 'cfy-config-softlayer')}, executionDetails);
    executionModel.setExecutionDetails(executionDetails);

    callback(null, executionModel);
};

//-----------  Overrides  ----------------------

SoloSoftlayerWidgetExecutor.prototype.executionType = 'Solo Softlayer';

SoloSoftlayerWidgetExecutor.prototype.getExecutionTasks = function () {
    return [
        soloSoftlayerInit,
        tasksDirectory.common.getWidget,
        tasksDirectory.common.saveExecutionModel,
        tasksDirectory.soloSoftlayer.setupDirectory,
        tasksDirectory.soloSoftlayer.setupEnvironmentVariables,
        tasksDirectory.soloSoftlayer.setupSoftlayerCli,
        tasksDirectory.soloSoftlayer.setupSoftlayerSsh,
        tasksDirectory.soloSoftlayer.editInputsFile,
        tasksDirectory.soloSoftlayer.runInitCommand,
        tasksDirectory.soloSoftlayer.runInstallWorkflowCommand,
        tasksDirectory.soloSoftlayer.clean
    ];
};

//-----------  Overrides END ----------------------


module.exports = SoloSoftlayerWidgetExecutor;
