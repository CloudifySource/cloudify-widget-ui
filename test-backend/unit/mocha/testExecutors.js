/**
 * Created by sefi on 22/01/15.
 */
'use strict';

var executors = require('../../../backend/executors');
var logger = require('log4js').getLogger('testExecutors.spec');

// Free test
//var executionModel = new executors.ExecutionModel('53d651d37818c889b6619020', function () {
//    logger.info('executionCallback');
//});

//executionModel.setLoginDetailsId('dddssss');
//
//var executor = new executors.FreeWidgetExecutor();
//freeExecutor.play(executionModel);


// Solo AWS test
//var executionDetails = {
//    isSoloMode: true,
//    providerUrl: 'https://www.dropbox.com/s/f44ngahig9k077w/ec2.tar.gz?dl=1',
//    appName: 'default',
//    serviceName: 'mongod',
//    providerRootPath: 'ec2',
//    providerName: 'ec2',
//    privateAmiId: 'ami-3cb92054',
//    privateAmiRegion: 'us-east-1',
//    privateImageId: 'ami-7aa83112',
//    privateImageRegion: 'us-east-1',
//    privateImages: [],
//    EC2: {
//        params: {
//            apiKey: '__key__',
//            secretKey: '__password__'
//        }
//    }
//};
//
//var executionModel = new executors.SoloExecutionModel('53d651d37818c889b6619020', function () {
//    logger.info('executionCallback');
//});
//
//executionModel.setExecutionDetails(executionDetails);
//
//var executor = new executors.SoloAWSWidgetExecutor();
//executor.play(executionModel);

// Solo softlayer test
var executionDetails = {
    softlayer: {
        params: {
            username: '__user__',
            apiKey: '__password__'
        }
    }
};

var executionModel = new executors.SoloExecutionModel('53d651d37818c889b6619020', function () {
    logger.info('executionCallback');
});
executionModel.setExecutionDetails(executionDetails);

var executor = new executors.SoloSoftlayerWidgetExecutor();
executor.play(executionModel);

