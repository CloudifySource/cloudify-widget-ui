'use strict';
var logger = require('log4js').getLogger('SessionController');
var sha1 = require('sha1');
//var _ = require('lodash');
var managers = require('../managers');

exports.login = function (req, res) {
    var credentials = req.body;
    logger.info('logging in user with email ' + credentials.email);
    managers.db.connect('users', function (db, collection, done) {
        collection.findOne({email: credentials.email, password: sha1(credentials.password)}, function (err, obj) {
            if (!!err) {
                res.status(500).send({'message': 'unable to login ' + err.message});
                done();
                return;
            }
            if (!!obj) {
                logger.info('user ' + credentials.email + ' logged in');
                req.session.userId = obj._id.toString();
                res.send(managers.users.getPublicUserDetails(obj));
                done();
                return;
            } else {
                logger.info('could not find user with these credentials : ' + credentials.email);
                res.status(500).send({'message': 'wrong username/password'});
                done();
                return;
            }
        });
    });
};


exports.signup = function (req, res) {
    var user = req.body;

    managers.users.createUser(user, function (err, user) {
        if (!!err) {
            logger.error('error while creating user ' + err);
            res.send(500, { 'message': err });
        }
        logger.info('user signed up successfully');
        res.send(managers.users.getPublicUserDetails(user));
    });
};

exports.logout = function (req, res) {
//    req.session.destroy();
    req.session = null;
    res.send({'message': 'logged out successfully'});
};