/**
 * Created by sefi on 22/01/15.
 */
'use strict';

var util = require('util');
var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');
var logger = require('log4js').getLogger('FreeWidgetExecutor');


function FreeWidgetExecutor(executionModel) {
    logger.info('ctor');
    AbstractWidgetExecutor.call(this, executionModel);
}

util.inherits(FreeWidgetExecutor, AbstractWidgetExecutor);

//-----------  Overrides  ----------------------
FreeWidgetExecutor.prototype.executionType = 'Free';

AbstractWidgetExecutor.prototype.getExecutionTasks = function () {
    return [this.getWidget];
};
//-----------  Overrides  ----------------------


module.exports = FreeWidgetExecutor;
