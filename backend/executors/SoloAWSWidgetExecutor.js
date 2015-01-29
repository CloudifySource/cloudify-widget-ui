/**
 * Created by sefi on 26/01/15.
 */
'use strict';

var util = require('util');
var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');
var tasksDirectory = require('./TasksDirectory');

function SoloAWSWidgetExecutor() {
    AbstractWidgetExecutor.call(this);
}

util.inherits(SoloAWSWidgetExecutor, AbstractWidgetExecutor);

//-----------  Overrides  ----------------------

SoloAWSWidgetExecutor.prototype.executionType = 'Solo AWS';

SoloAWSWidgetExecutor.prototype.getExecutionTasks = function () {
    return [
        tasksDirectory.common.getWidget,
        tasksDirectory.common.saveExecutionModel,
        tasksDirectory.common.updateExecutionModelAddPaths,
        tasksDirectory.soloAws.updateExecutionModelAddExecutionDetails,
        tasksDirectory.common.downloadRecipe,
        tasksDirectory.common.downloadCloudProvider,
        tasksDirectory.soloAws.generateKeyPair,
        tasksDirectory.soloAws.modifyImages,
        tasksDirectory.common.overrideCloudPropertiesFile,
        tasksDirectory.common.overrideRecipePropertiesFile,
        tasksDirectory.soloAws.runBootstrapAndInstallCommands
    ];
};

//-----------  Overrides END ----------------------


module.exports = SoloAWSWidgetExecutor;
