'use strict';
var managers = require('../managers');
var logger = require('log4js').getLogger('AdminUsersController');

exports.getAllUsers = function (req, res) {
    managers.adminUsers.getAll({ '$or': [
        {'isAdmin': false},
        {'isAdmin': {'$exists': false}}
    ]}, function (result) {
        res.send(result);
    });
};



function updateAccountDescription( poolKey, user, callback ){
    managers.poolClient.readByUuid( poolKey, user.poolKey, function( err, data ){
        logger.info('updating description', err, data) ;
        var message = ' used by ' + user.email + ' at ' + require('os').hostname();
        if ( data.hasOwnProperty('description') && !!data.description ){
            message = data.description + ' and ' + message;
        }

        managers.poolClient.setAccountDescription( poolKey, data.id, message, function(){
            logger.info('description was set. ignoring errors');
            callback();
        });

    } );
}

/**
 * This method creates a new account on pool manager and assigns the new UUID to the user
 * @param req
 * @param res
 */
exports.setPoolKey = function (req, res) {
    logger.info(req.params.userId);
    var user = req.actionUser;
    logger.info('actionUser is ', user);
    function updateDescription(){
        updateAccountDescription( req.user.poolKey, user, function(){  res.send(user); });
    }

    if ( !!req.body && !!req.body.poolKey ){
        logger.info('got a pool key from request. I will set that');
        user.poolKey = req.body.poolKey;
        managers.users.updateUser(user);
        updateDescription();
        return;
    }

    logger.info('creating new pool key for user');
    managers.poolClient.createAccount(req.user.poolKey, function (err, data) {
        logger.info('new pool key generated', typeof(data), data, data.id, data.uuid);
        user.poolKey = data.uuid;
        managers.users.updateUser(user);
        res.send(user);
        updateDescription();

    });

};

exports.setAdminPoolKey = function (req, res) {

    var newPoolKey = req.body.poolKey;
    if (!newPoolKey) {
        res.send(500, { 'message': 'new pool key not specified' });
    }
    logger.info('setting admin pool key to: ' + newPoolKey);
    req.user.poolKey = newPoolKey;
    managers.db.connect('users', function (db, collection) {
        collection.update({'_id': req.user._id}, req.user, function () {
            res.send(req.user);
        });

    });
};

exports.testAdminPoolKey = function (req, res) {
    logger.info(req.body);
    managers.poolClient.readAccounts(req.body.poolKey, function (err) {
        if (!err) {
            res.send(200);
        } else {
            res.send(500);
        }
    });
};

/**
 * removes the pool key from the user without deleting it at the manager's side.
 * @param req
 * @param res
 */
exports.removePoolKey = function (req, res) {
    var user = req.actionUser;
    delete user.poolKey;
    managers.users.updateUser(user, function (err) {
        if (!!err) {
            res.send(500, { 'message': err });
        }
        res.send(user);
    });
};

exports.loadUser = function (req, res, next) {

    if (!!req.param('userId')) {
        var userId = req.param('userId');
        managers.users.findById(userId, function (error, result) {
            //ignore errors; just log them.
            if (!!error) {
                res.send(404, { 'message': 'could not find user ' + req.params.userId });
                return;
            }

            if (!!result) {
                req.actionUser = result;

            }

            next();
        });


    } else {
        next();
    }

};