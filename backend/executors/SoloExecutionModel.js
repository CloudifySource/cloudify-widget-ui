/**
 * Created by sefi on 28/01/15.
 */
'use strict';
//var dbService = require('../services/DbService');
var util = require('util');
var ExecutionModel = require('./ExecutionModel');

function SoloExecutionModel(widgetId, callback) {
    ExecutionModel.call(this, widgetId, callback);
}

util.inherits(SoloExecutionModel, ExecutionModel);

SoloExecutionModel.prototype.setExecutionDetails = function (executionDetails) {
    this.executionDetails = executionDetails;
};

SoloExecutionModel.prototype.getExecutionDetails = function () {
    return this.executionDetails;
};

SoloExecutionModel.prototype.setCloudDistFolderName = function (cloudDistFolderName) {
    this.cloudDistFolderName = cloudDistFolderName;
};

SoloExecutionModel.prototype.getCloudDistFolderName = function () {
    return this.cloudDistFolderName;
};

SoloExecutionModel.prototype.setRecipeDistFolderName = function (recipeDistFolderName) {
    this.recipeDistFolderName = recipeDistFolderName;
};

SoloExecutionModel.prototype.getRecipeDistFolderName = function () {
    return this.recipeDistFolderName;
};

SoloExecutionModel.prototype.setCommands = function (commands) {
    this.commands = commands;
};

SoloExecutionModel.prototype.getCommands = function () {
    return this.commands;
};

SoloExecutionModel.prototype.setSshKey = function (sshKey) {
    this.sshKey = sshKey;
};

SoloExecutionModel.prototype.getSshKey = function () {
    return this.sshKey;
};


module.exports = SoloExecutionModel;
