/**
 * Created by sefi on 22/01/15.
 */
'use strict';
var logger = require('log4js').getLogger('AbstractWidgetExecutor');

function AbstractWidgetExecutor() {
    logger.info('ctor');
}

/**
 * <b>Abstract. Should be overridden by extending classes.</b>
 * The execution type.
 * @type {string}
 */
AbstractWidgetExecutor.prototype.executionType;

AbstractWidgetExecutor.prototype.sendEmail = function() {};

/**
 * The template function for the execution.
 */
AbstractWidgetExecutor.prototype.play = function() {
    logger.info('Executing ' + this.executionType);
    this.sendEmail();
};

module.exports = AbstractWidgetExecutor;

