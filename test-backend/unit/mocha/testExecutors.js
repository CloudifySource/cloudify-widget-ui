/**
 * Created by sefi on 22/01/15.
 */
'use strict';

var executors = require('../../../backend/executors');
var logger = require('log4js').getLogger('testExecutors.spec');

var executionModel = new executors.ExecutionModel('53d651d37818c889b6619020', function () {
    logger.info('executionCallback');
});

// Free test
//executionModel.setLoginDetailsId('dddssss');
//
//var executor = new executors.FreeWidgetExecutor();
//freeExecutor.play(executionModel);


// Solo AWS test
var executionDetails = {
    isSoloMode: true,
    providerUrl: 'https://www.dropbox.com/s/f44ngahig9k077w/ec2.tar.gz?dl=1',
    appName: 'default',
    serviceName: 'mongod',
    providerRootPath: 'ec2',
    providerName: 'ec2',
    privateAmiId: 'ami-3cb92054',
    privateAmiRegion: 'us-east-1',
    privateImageId: 'ami-7aa83112',
    privateImageRegion: 'us-east-1',
    privateImages: [],
    EC2: {
        params: {
            apiKey: 'AKIAIBTYJKCAU66HBQ5Q',
            secretKey: '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'
        }
    }
};

executionModel.setExecutionDetails(executionDetails);

var executor = new executors.SoloAWSWidgetExecutor();
executor.play(executionModel);
