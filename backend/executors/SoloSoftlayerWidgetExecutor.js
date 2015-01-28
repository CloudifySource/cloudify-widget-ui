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
        tasksDirectory.getWidget,
        tasksDirectory.saveExecutionModel,
        tasksDirectory.updateExecutionModelAddPaths,
        tasksDirectory.updateExecutionModelAddExecutionDetails,
        tasksDirectory.downloadRecipe,
        tasksDirectory.downloadCloudProvider,
        tasksDirectory.generateKeyPair,
        tasksDirectory.modifyImages,
        tasksDirectory.overrideCloudPropertiesFile,
        tasksDirectory.overrideRecipePropertiesFile,
        tasksDirectory.runBootstrapAndInstallCommands
    ];
};

//-----------  Overrides END ----------------------


module.exports = SoloSoftlayerWidgetExecutor;
