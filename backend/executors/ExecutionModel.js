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

ExecutionModel.prototype.setExecutionObjectId = function (executionObjectId) {
    this.executionObjectId = executionObjectId;
};

ExecutionModel.prototype.getExecutionObjectId = function () {
    return this.executionObjectId;
};



module.exports = ExecutionModel;
