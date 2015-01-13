'use strict';
/**
 * @module UsersMiddleware
 * @description
 * collection of middlewares involving users
 */


var models = require('../models');
var services = require('../services');
var logger = require('log4js').getLogger('UsersMiddleware');

/**
 *
 * @description
 * looks for <code>userId</code> param on request. <br/>
 * find and places <code>requestUser</code> on <code>req</code> if exists.<br/>
 * returns code 400 otherwise.<br/>
 *
 * @param req the request
 * @param res the response
 * @param next next middleware
 */

exports.userOnRequest=function( req, res, next ){
    exports.optionalUserOnRequest( req, res, function(){
        if ( !req.requestUser ){
            new services.errorResponse.InvalidRequest('expected a user on request').send(res);
            return;
        }else{
            next();
        }
    });
};

/**
 * @description
 * Verified that user X can manage user Y. relies on <code>req.user</code> and <code>req.requestUser</code>.<br/>
 * All users can manage themselves.<br/>
 * Currently our only requirement for users to manage others is that they will be admin.
 *
 * @param req the request
 * @param res the response
 * @param next next middleware
 */
exports.userCanManageUser = function( req, res, next ){
    if ( !req.user || !req.requestUser ){
        new services.errorResponse.InvalidRequest('missing user and requestUser on request').send(res);
        return;
    }

    if ( !req.user.isAdmin && req.user._id.toHexString() !== req.requestUser._id.toHexString() ){
        new services.errorResponse.Unauthorized('user cannot manage other users').send(res);
        return;
    }

    next();
};

/**
 * @description the same as {@link #optionalUserOnRequest} but if no userId on request, then puts <code>req.user</code>.
 *
 * @param req the request
 * @param res the response
 * @param next next middleware
 */
exports.userOnRequestDefaultToMe = function( req, res, next ){
    exports.optionalUserOnRequest(req, res, function(){
        if ( !req.requestUser ){
            req.requestUser = req.user;
        }

        next();
    });
};


/**
 * @description
 * checks if parameter <code>userId</code> exists on request. <br/>
 * If so, finds it and puts it on <code>req.requestUser</code><br/>
 * If not, continues.<br/>
 * Fails only if <code>userId</code> is on request and we either could not find the user or there was a problem talking to the database while searching for the user.
 *
 * @param req the request
 * @param res the response
 * @param next next middleware
 */
exports.optionalUserOnRequest = function( req, res, next ){
    var userId = req.param('userId');

    if ( !userId ){
        next();
        return;
    }

    models.user.findById(userId, function (err, user) {

        logger.trace('found request user', err, user);

        if (!!err) {
            new services.errorResponse.InvalidRequest('error while fetching user').send(res);
            return;
        }

        if ( !!userId && !user ){
            new services.errorResponse.NotFound('could not find userId [' + userId + ']').send(res);
            return;
        }


        req.requestUser = user;
        next();
    });
};
