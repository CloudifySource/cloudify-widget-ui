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

ExecutionModel.prototype.getWidgetId = function() {
    return this.widgetId;
};

ExecutionModel.prototype.getWidgetObjectId = function() {
    return this.widgetObjectId;
};

ExecutionModel.prototype.getExecutionCallback = function() {
    return this.executionCallback;
};

ExecutionModel.prototype.setLoginDetailsId = function(loginDetailsId) {
    this.loginDetailsId = loginDetailsId;
};

ExecutionModel.prototype.getLoginDetailsId = function() {
    return this.loginDetailsId;
};





ExecutionModel.prototype.setTestString = function(testString) {
    this.testString = testString;
};

ExecutionModel.prototype.getTestString = function() {
    return this.testString;
};

module.exports = ExecutionModel;
