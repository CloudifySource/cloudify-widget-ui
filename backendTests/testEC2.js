/**
 * Created by sefi on 30/11/14.
 */
'use strict';

var logger = require('log4js').getLogger('index');
var ec2Service = require('../backend/services/clouds/ec2');
var conf = require('../backend/Conf');

var testHandler = function(err, data) {
    if (err) {
        logger.debug(err);
    }

    logger.debug(data);
};

ec2Service.modifyImageAttribute(conf.testEC2.apiKey, conf.testEC2.secretKey, 'us-east-1', 'ami-8039a7e8', testHandler);

ec2Service.describeRegions(conf.testEC2.apiKey, conf.testEC2.secretKey, testHandler);