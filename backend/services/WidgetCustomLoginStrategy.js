'use strict';

var logger = require('log4js').getLogger('WidgetCustomLoginStrategy');
var passport = require('passport-strategy');
var util = require('util');


function Strategy() {
    logger.info('constructor', arguments);
    passport.Strategy.call(this);
}

util.inherits(Strategy, passport.Strategy);


function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

Strategy.prototype.authenticate = function (req, options) {
    var data = req.query.data || req.body;

    if (typeof(data) === 'string') {
        data = JSON.parse(data);
    }

    logger.info('authenticating', data);
    var self = this;

    if (!data.firstName) {
        logger.info('failing due to lack of name');
        return self.fail({'message': options.badRequestMessage || 'missing name'}, 400);
    }

    if (!data.lastName) {
        return self.fail({'message': options.badRequestMessage || 'missing last name'}, 400);
    }

    if (!data.email) {
        return self.fail({'message': options.badRequestMessage || 'missing email'}, 400);
    }

    if (!validateEmail(data.email)) {
        return self.fail({'message': options.badRequestMessage || 'invalid email'}, 400);
    }


    self.success({
        'name': {
            'familyName': data.lastName,
            'givenName': data.firstName

        },
        'emails': [
            { 'value': data.email }
        ]
    });


};


module.exports.Strategy = Strategy;