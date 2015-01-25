/**
 * Created by sefi on 22/01/15.
 */
'use strict';

var util = require('util');
var abstractwidgetExecutor = require('./AbstractWidgetExecutor');
var logger = require('log4js').getLogger('FreeWidgetExecutor');

function FreeWidgetExecutor() {
    logger.info('ctor');
    abstractwidgetExecutor.call(this);
}

util.inherits(FreeWidgetExecutor, abstractwidgetExecutor);

FreeWidgetExecutor.prototype.executionType = 'Free';

FreeWidgetExecutor.prototype.sendEmail = function() {
    logger.info('FreeWidgetExecutor sending email...');
};

module.exports = FreeWidgetExecutor;
