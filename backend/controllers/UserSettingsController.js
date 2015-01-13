'use strict';

/**
 * @module UserSettingsController
 * @description
 * a collection of functions to manage user's settings.
 */


var models = require('../models');
var services = require('../services');
var logger = require('log4js').getLogger('UserSettingsController');

/**
 * returns all information about the user
 *
 * @param req
 * @param res
 */
exports.read = function(req, res ){
    res.send(req.requestUser);
};

/**
 *
 * @description allows users to change password
 *
 * @param req
 * @param res
 */
exports.changePassword = function( req, res ){
    var user = req.requestUser;
    var changePasswordDetails = req.body;

    logger.trace('user ' + user.email + ' is changing password');

    if ( !changePasswordDetails.oldPassword || !changePasswordDetails.newPassword || !changePasswordDetails.newPasswordAgain ){
        new services.errorResponse.InvalidRequest('missing change password details on request. expecting 3 : oldPassword, newPassword, newPasswordAgain').send(res);
        return;
    }

    if ( changePasswordDetails.newPassword !== changePasswordDetails.newPasswordAgain ){
        new services.errorResponse.InvalidRequest('new password retype does not match').send(res);
        return;
    }

    if ( models.User.encryptPassword(changePasswordDetails.oldPassword) !== user.password ){
        new services.errorResponse.InvalidRequest('oldPassword does not match').send(res);
        return;
    }

    user.password = models.User.encryptPassword(changePasswordDetails.newPassword);
    new models.User(user).update( function (err){
        if (!!err ){
            new services.errorResponse.InternalError(err, 'error while saving user');
        }
        res.send({ 'message' : 'updated successfully' });
    });

};
