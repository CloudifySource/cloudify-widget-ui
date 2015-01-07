'use strict';

/**
 * @module SessionMiddleware
 * @description
 * middlewares that operate on the session.
 *
 */
//var dbManager = require('../managers').db;
var usersManager = require('../managers').users;
var logger = require('log4js').getLogger('widgetMiddleware');


/**
 *
 * @description
 * relies on 'loggedUser' middleware.<br/>
 * verifies the user on session is admin<br/>
 * return 401 if not<br/>
 *
 * @param req the request
 * @param res the response
 * @param next next middleware
 **/
exports.adminUser = function( req, res, next){
    if ( !req.user.isAdmin ){
        res.send(401, {'message' : 'need to be admin'});
        return;
    }
    logger.info('user ' + req.user.email  + ' is admin');
    next();
};

/**
 * @description
 * checks if there is a userId on session cookie. <br/>
 * find and puts <code>user</code> on <code>req</code> if exists<br/>
 * otherwise returns code 401.<br/>
 *
 * @param req the request
 * @param res the response
 * @param next next middleware
 **/
exports.loggedUser = function ( req, res, next ){
    if ( !req.session ){
        res.send(401, {'message': 'need to login. no session'});
        return;
    }
    var userId = req.session.userId;
    if ( !userId ){
        res.send(401, {'message':'need to login'});
        return;
    }


    usersManager.findById( userId, function( error, result ){
        var err = error;
        if ( !!err ){
            logger.info('unable to verify if user is logged in : ' + err.message );
            res.send(401, {'message' : 'unable to verify session : '  + err.message });
            return;
        }
        if ( !!result ){
            logger.trace('user is logged in : '  + result.email );
            req.user = result;
            next();
            return;
        }
        // default behavior if user was not found and we didn't get an error from DB.
        // lets delete the cookie and redirect to login

        req.session = null;
        res.send(401, {'message': 'need to relogin'});

    } );
};