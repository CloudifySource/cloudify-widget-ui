'use strict';
var dbManager = require('./DbManager');
var widgetManager = require('./WidgetManager');
var mailchimpService = require('../services/MailchimpService');
var widgetLoginTypes = require('../services/WidgetLoginTypes');
var logger = require('log4js').getLogger('WidgetLoginsManager');

exports.saveLoginToDb = function (loginData, callback) {

    var correctLoginDetails = {};

    // must remove dots from strings
    for (var i in loginData.loginDetails) {
        if (loginData.loginDetails.hasOwnProperty(i)) {
            var correctI = i.replace(/\./g, '_');
            correctLoginDetails[correctI] = loginData.loginDetails[i];
        }
    }

    loginData.loginDetails = correctLoginDetails;


    dbManager.connect('widgetLogin', function (db, collection, done) {

        collection.findOne({ 'type': loginData.type, 'uid': loginData.uid, 'widgetId': loginData.widgetId  }, function (err, result) {
            if (!!err) {
                logger.error('unable to determine if ', loginData.type, ' already exists due to an error', err);
                done();
                return;
            }
            if (!!result) {
                logger.info(loginData.type, 'login already exists. updating', loginData.uid);
                loginData._id = result._id;
                collection.update({'_id': result._id}, loginData, function (err, nUpdated) {
                    if (!!err) {
                        logger.error('error while updating', err);
                        callback(null, result); // do not bubble error up.
                        done();
                        return;
                    }

                    logger.info('updated ', nUpdated, ' lines');
                    callback(null, loginData);
                    done();
                    return;

                });
                return;
            }

            logger.info('login data does not exist. recreating');
            collection.insert(loginData, function (err, obj) {
                if (!!err) {
                    logger.error('unable to save login details due to an error', err);
                    done();
                    return;
                }
                done();

                callback(null, obj);


            });
        });

    });
};

/**
 * type = 'google' or 'custom' etc..
 */
exports.getWidgetLoginsByType = function (userId, type, callback) {
    dbManager.connect('widgetLogin', function (db, collection, done) {
        collection.find({ 'userId': userId, 'type': type }).toArray(function (err, result) {
            done();
            callback(err, result);
            return;
        });
    });
};

exports.getWidgetLoginById = function (loginDetailsId, callback) {
    dbManager.connect('widgetLogin', function (db, collection, done) {
        collection.findOne({ '_id': dbManager.toObjectId(loginDetailsId) }, function (err, result) {
            done();
            callback(err, result);
            return;
        });
    });
};

exports.getWidgetLogins = function (userId, callback) {
    dbManager.connect('widgetLogin', function (db, collection, done) {
        collection.find({ 'userId': userId }).toArray(function (err, result) {
            done();
            callback(err, result);
            return;
        });
    });
};

function _getLoginHandler(widget, handler) {
    if (widget.hasOwnProperty('socialLogin') &&
        widget.socialLogin.hasOwnProperty('handlers') &&
        widget.socialLogin.handlers.hasOwnProperty(handler)) {
        return widget.socialLogin.handlers[handler];
    }

}


function _sendToMailchimp(widget, mailchimpLoginDetails) {
    var handler = _getLoginHandler(widget, 'mailchimp');
    if (!!handler && !!handler.enabled) {
        logger.info('sending to mailchimp');

        mailchimpService.subscribe(
            {
                'apikey': handler.apiKey,
                'update_existing': true,
                'id': handler.listId,
                'email': {
                    'email': mailchimpLoginDetails.email
                },

                'merge_vars': {
                    'NAME': mailchimpLoginDetails.NAME,
                    'LASTNAME': mailchimpLoginDetails.LASTNAME
                }
            }
        );


    } else {
        logger.info('handler mailchimp does not exist. ignoring');
    }

}


exports.getLoginTypes = function () {
    return widgetLoginTypes.getLoginTypes();
};

exports.handleWidgetLogin = function (loginTypeId, widgetId, loginDetails, callback) {

    var name = loginDetails.name;
    var lastName = loginDetails.lastName;
    var uid = loginDetails.uid || loginDetails.email;
    var email = loginDetails.email;

    widgetManager.findById(widgetId, function (err, widget) {
        if (!!err) { // NOTE : do not return error response here. it does not matter to the users. it is our bug and we should overcome it.
            callback(new Error('unable to find widget due to error ', err));
            return;
        }

        if (!widget) {
            callback(new Error('widget does not exist ', widgetId));
            return;
        }

        // get login type
        var loginType = widgetLoginTypes.getById(loginTypeId);


        exports.saveLoginToDb({  'type': loginType.id, 'timestamp': new Date().getTime(), 'widgetId': widget._id, 'userId': widget.userId, 'uid': uid, 'loginDetails': loginDetails }, callback);

        // get login configuration from widget
        if (!!loginType && !!loginType.data && !!loginType.data.mailchimp) {
            _sendToMailchimp(widget, { 'NAME': name, 'LASTNAME': lastName, 'email': email});
        } else {
            logger.info('socialLogin ' + loginType.id + ' either does not support mailchimp or is configured to not send data to mailchimp. skipping mailchimp');
        }

    });
};
