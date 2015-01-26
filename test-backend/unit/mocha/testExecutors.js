/**
 * Created by sefi on 22/01/15.
 */
'use strict';

var executors = require('../../../backend/executors');
var logger = require('log4js').getLogger('testExecutors.spec');

var executionModel = new executors.ExecutionModel('53d651d37818c889b6619020', function() {
     logger.info('executionCallback');
});
executionModel.setLoginDetailsId('dddssss');

var freeExecutor = new executors.FreeWidgetExecutor();
freeExecutor.play(executionModel);
