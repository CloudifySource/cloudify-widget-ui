'use strict';


var aws = require('aws-sdk');
var logger = require('log4js').getLogger('EC2.index');
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
            return;
        }

        callback(null, data);
    });
};

/**
 *
 * @param image
 * @param userId - accountId
 * @param data = {
 *  'action' : 'add','remove'
 * }
 * @returns {{ImageId: *, LaunchPermission: {}}}
 */
var getModifyImageReqObj = function (image, userId, data) {
    var reqObj = {
        ImageId: image.imageId,
        LaunchPermission: {}
    };

    var item = {
        Group: 'all',
        UserId: userId
    };

    if (data.action === 'add') {
        reqObj.LaunchPermission.Add = [item];
    } else {
        reqObj.LaunchPermission.Remove = [item];
    }

    return reqObj;
};

/**
 *
 * @param data = {
 *  'apiKey' : __,
 *  'secretKey' : __,
 *  'action' : 'add' , 'remove'
 * }
 * @param image
 * @param callback
 */
exports.modifyImage = function modifyImage(data, image, callback) {
    var creds = {
        'accessKeyId': data.apiKey,
        'secretAccessKey': data.secretKey,
        'region': image.imageRegion
    };

    var ec2 = new aws.EC2(creds);

    logger.debug('modifying image launch permissions for ', image.imageId);

    exports.getUser(data.apiKey, data.secretKey, function (err, result) {
        if (err) {
            callback(err, null);
            return;
        }

        var reqObj = getModifyImageReqObj(image, result.User.UserId, data);

        ec2.modifyImageAttribute(reqObj, function (err) {
            if (err) {
                image.fail = true;
                image.err = err;
            } else {
                image.fail = false;
            }

            callback(null, image);
        });
    });

};

/**
 *
 * shares or unshares an image
 *
 * @param data = {
                action: isAdd ? 'add' : 'remove',
                apiKey: apiKey,
                secretKey: secretKey,
                images: images
            };
 *
 * @param callback - function (err, result)
 */
exports.modifyImages = function modifyImages(data, callback) {
    var tasks = [];

    // define the function that shares
    function createTask(image) {
        return function doShare(callback) {
            exports.modifyImage(data, image, callback);
        };
    }

    // define list of tasks to run in parallel
    for (var i = 0; i < data.images.length; i++) {
        var image = data.images[i];
        tasks.push(createTask(image)); // add a 'share' task
    }

    // run all 'share' tasks in parallel
    async.parallel(tasks, function doneSharing(err, results) {
        if (err) {
            callback(err, {});
            return;
        }

        // gather failures into a readable message
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

/**
 *
 * gets list of regions defined on user
 *
 * @param apiKey
 * @param secretKey
 * @param callback - function( err, result )
 */

exports.describeRegions = function (apiKey, secretKey, callback) {
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