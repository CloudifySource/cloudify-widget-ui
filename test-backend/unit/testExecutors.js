/**
 * Created by sefi on 22/01/15.
 */
'use strict';

var executors = require('../../backend/executors/index');
var logger = require('log4js').getLogger('testExecutors.spec');
var testConf = require('./conf/dev/me-test-conf.json');

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
//    EC2: testConf.EC2
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


/**
 *
 * To make this work:
 1. execute the install.sh script to setup the virtualenv
 2. in IntelliJ terminal exec
 2.a. source softlayer_widget/bin/activate
 2.b. node testExecutors.js

 You also need test-backend/unit/conf/dev/me-test-conf.json to include:
 {
    "softlayer": {
        "params": {
            "username": "user",
            "apiKey": "key"
        }
    },
    "EC2": {
        "params": {
            "apiKey": "key",
            "secretKey": "secret"
        }
    }
 }
 *
 * @type {{isSoloMode: boolean, providerUrl: string, appName: string, serviceName: string, providerRootPath: string, providerName: string, privateAmiId: string, privateAmiRegion: string, privateImageId: string, privateImageRegion: string, privateImages: Array, softlayer: *}}
 */

// Solo softlayer test
var executionDetails = {
    isSoloMode: true,
    providerUrl: 'https://www.dropbox.com/s/f44ngahig9k077w/ec2.tar.gz?dl=1',
    appName: 'default',
    serviceName: 'mongod',
    providerRootPath: 'ec2',
    providerName: 'softlayer',
    privateAmiId: 'ami-3cb92054',
    privateAmiRegion: 'us-east-1',
    privateImageId: 'ami-7aa83112',
    privateImageRegion: 'us-east-1',
    privateImages: [],
    softlayer: testConf.softlayer
};

var executionModel = new executors.SoloExecutionModel('53d651d37818c889b6619020', function () {
    logger.info('executionCallback');
});
executionModel.setExecutionDetails(executionDetails);

var executor = new executors.SoloSoftlayerWidgetExecutor();
executor.play(executionModel);

