/**
 * Created by sefi on 26/01/15.
 */
'use strict';

var util = require('util');
var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');
var tasksDirectory = require('./TasksDirectory');
var logger = require('log4js').getLogger('SoloAWSWidgetExecutor');

function SoloAWSWidgetExecutor() {
    logger.info('ctor');
    AbstractWidgetExecutor.call(this);
}

util.inherits(SoloAWSWidgetExecutor, AbstractWidgetExecutor);

//-----------  Overrides  ----------------------
SoloAWSWidgetExecutor.prototype.executionType = 'Solo AWS';

SoloAWSWidgetExecutor.prototype.getExecutionTasks = function () {
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


module.exports = SoloAWSWidgetExecutor;
