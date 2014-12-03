'use strict';


var aws = require('aws-sdk');
var logger = require('log4js').getLogger('index');
var async = require('async');


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

exports.getUser = function getUser(apiKey, secretKey, callback) {
    var creds = {
        'accessKeyId': apiKey,
        'secretAccessKey': secretKey,
        'region': 'us-east-1'
    };

    var iam = new aws.IAM(creds);
    iam.getUser({}, function (err, data) {
        if (err) {
            logger.error('Could not locate user ', apiKey);
            callback(err, null);
        }

        callback(null, data);
    });
};

exports.modifyImage = function modifyImage(apiKey, secretKey, region, imageId, callback) {
    //todo: add support for all regions (if region is undefined) - try each one until one succeeds or all failed.

    var creds = {
        'accessKeyId': apiKey,
        'secretAccessKey': secretKey,
        'region': region
    };

    var ec2 = new aws.EC2(creds);

    logger.debug('modifying image launch permissions for ', imageId);

    exports.getUser(apiKey, secretKey, function (err, data) {
        if (err) {
            callback(err, null);
        }

        var params = {
            ImageId: imageId,
            LaunchPermission: {
                Add: [
                    {
                        Group: 'all',
                        UserId: data.User.UserId
                    }
                ]
            }
        };

        ec2.modifyImageAttribute(params, callback);
    });

};

exports.modifyImages = function modifyImages(apiKey, secretKey, images, callback) {
    var tasks = [];

    function createTask(image) {
        return function (callback) {
            exports.modifyImage(apiKey, secretKey, image.imageRegion, image.imageId, callback);
        };
    }

    for (var i = 0; i < images; i++) {
        var image = images[i];
        tasks.push(createTask(image));
    }

    async.parallel(tasks, function (err, results) {
        if (err) {
            callback(err, {});
        }

        var failed = '';
        for (var i = 0; i < results.length; i++) {
            var image = results[i];
            if (image.fail) {
                failed += 'Private image ' + image.imageId + ' region ' + image.imageRegion + ' launch modification failed. Error: ' + image.err.message + '\n';
            }
        }

        if (failed !== '') {
            callback(new Error(failed), {});
        } else {
            callback(null, results);
        }

    });

};

exports.describeRegions = function(apiKey, secretKey, callback) {
    var creds = {
        'accessKeyId': apiKey,
        'secretAccessKey': secretKey,
        'region': 'us-east-1'
    };

    var ec2 = new aws.EC2(creds);
    ec2.describeRegions({}, callback);
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