/**
 * Created by sefi on 25/01/15.
 */
'use strict';
//var logger = require('log4js').getLogger('ExecutionModel');
var dbService = require('../services/DbService');

function ExecutionModel(widgetId, callback) {
    this.widgetId = widgetId;
    this.widgetObjectId = dbService.toObjectId(widgetId);
    this.executionCallback = callback;
}

ExecutionModel.prototype.getWidgetId = function () {
    return this.widgetId;
};

ExecutionModel.prototype.getWidgetObjectId = function () {
    return this.widgetObjectId;
};

ExecutionModel.prototype.getExecutionCallback = function () {
    return this.executionCallback;
};

ExecutionModel.prototype.setLoginDetailsId = function (loginDetailsId) {
    this.loginDetailsId = loginDetailsId;
};

ExecutionModel.prototype.getLoginDetailsId = function () {
    return this.loginDetailsId;
};

ExecutionModel.prototype.setExecutionDetails = function (executionDetails) {
    this.executionDetails = executionDetails;
};

ExecutionModel.prototype.getExecutionDetails = function () {
    return this.executionDetails;
};

ExecutionModel.prototype.setWidget = function (widget) {
    this.widget = widget;
};

ExecutionModel.prototype.getWidget = function () {
    return this.widget;
};

ExecutionModel.prototype.setPoolKey = function (poolKey) {
    this.poolKey = poolKey;
};

ExecutionModel.prototype.getPoolKey = function () {
    return this.poolKey;
};

ExecutionModel.prototype.setExecutionId = function (executionId) {
    this.executionId = executionId;
};

ExecutionModel.prototype.getExecutionId = function () {
    return this.executionId;
};

ExecutionModel.prototype.setExecutionObjectId = function (executionObjectId) {
    this.executionObjectId = executionObjectId;
};

ExecutionModel.prototype.getExecutionObjectId = function () {
    return this.executionObjectId;
};

ExecutionModel.prototype.setDownloadsPath = function (downloadsPath) {
    this.downloadsPath = downloadsPath;
};

ExecutionModel.prototype.getDownloadsPath = function () {
    return this.downloadsPath;
};

ExecutionModel.prototype.setLogsPath = function (logsPath) {
    this.logsPath = logsPath;
};

ExecutionModel.prototype.getLogsPath = function () {
    return this.logsPath;
};

ExecutionModel.prototype.setShouldInstall = function (shouldInstall) {
    this.shouldInstall = shouldInstall;
};

ExecutionModel.prototype.getShouldInstall = function () {
    return this.shouldInstall;
};

ExecutionModel.prototype.setNodeModel = function (nodeModel) {
    this.nodeModel = nodeModel;
};

ExecutionModel.prototype.getNodeModel = function () {
    return this.nodeModel;
};

ExecutionModel.prototype.setCloudDistFolderName = function (cloudDistFolderName) {
    this.cloudDistFolderName = cloudDistFolderName;
};

ExecutionModel.prototype.getCloudDistFolderName = function () {
    return this.cloudDistFolderName;
};

ExecutionModel.prototype.setRecipeDistFolderName = function (recipeDistFolderName) {
    this.recipeDistFolderName = recipeDistFolderName;
};

ExecutionModel.prototype.getRecipeDistFolderName = function () {
    return this.recipeDistFolderName;
};


module.exports = ExecutionModel;
