'use strict';


var aws = require('aws-sdk');
var logger = require('log4js').getLogger('index');


exports.createKeyPair = function createKeyPair(apiKey, secretKey, region, keyName, callback) {
    var ec2 = new aws.EC2({
        'accessKeyId': apiKey,
        'secretAccessKey': secretKey,
        'region': region
    });
    logger.debug('creating keypair with name', keyName);
    ec2.createKeyPair({ 'KeyName': keyName }, callback);
};

exports.deleteKeyPair = function deleteKeyPair(apiKey, secretKey, region, keyName, callback) {
    var ec2 = new aws.EC2({
        'accessKeyId': apiKey,
        'secretAccessKey': secretKey,
        'region': region
    });
    logger.debug('deleting keypair with name', keyName);
    ec2.deleteKeyPair({ 'KeyName': keyName }, callback);
};


/**
 *
 *
 * This main method is an example of how to use this code.
 *
 *
 * it expects a configuration file with secret value of the following structure
 *
 *  {
 *   "apiKey" : "__apikey__",
 *   "secretKey" : "__secretKey__",
 *   "keyPairName" : "__keyPairName__",
 *   "region":"__region__"
 *  }
 *
 *
 */

if (require.main === module) {
    var fs = require('fs');
    var file = __dirname + '/../../../../conf/dev/testEc2.json';

    fs.readFile(file, 'utf8', function (err, data) {
        if (err) {
            logger.error('unable to read configuration', file, err);
            return;
        }

        data = JSON.parse(data);

        exports.createKeyPair(data.apiKey, data.secretKey, data.region, data.keyPairName, function (err, _data) {
            if (!!err) {
                logger.error('unable to create keypair', err);
            } else {
                logger.info('created keypair successfully', _data);
                exports.deleteKeyPair(data.apiKey, data.secretKey, data.region, data.keyPairName, function (err, _data) {
                    if (!!err) {
                        logger.error('unable to delete keypair', err);
                    } else {
                        logger.info('deleted keypair successfully', _data);
                    }
                });
            }
        });

    });

}