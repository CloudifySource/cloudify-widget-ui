'use strict';
var logger = require('log4js').getLogger('WidgetLoginsController');
var passport = require('passport');
var conf = require('../Conf');

var managers = require('../managers');
var GoogleStrategy = require('passport-google').Strategy;
var LinkedInStrategy = require('passport-linkedin').Strategy;
//var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GitHubStrategy = require('passport-github').Strategy;
var CustomStrategy = require('../services/WidgetCustomLoginStrategy').Strategy;
//var _ = require('lodash');

//var https = require('https');
var Client = require('node-rest-client').Client;
var client = new Client();
client.on('error', function (err) {
    logger.error(err);
});


passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

/***
 *
 *
 * This controller allows login with social network.
 *
 * The expected profile construct is:
 *
 *    {
 *          displayName: 'Guy Mograbi',
            emails: [ { value: 'guym.at.gigaspaces@gmail.com' } ],
 name: { familyName: 'Mograbi', givenName: 'Guy' }
 }
 *
 *
 * However, it seems not all social networks supply enough info for passport to construct this.
 *
 * For example - github MAY or MAY NOT supply the info. It depends on user's profile.
 *
 * So not all logins can integrate with mailchimp.
 *
 ***/

/**
 *
 * @param req
 * @returns {*}
 * @private
 */

function _returnURL(req) {
    return req.absoluteUrl('/backend/widgets/' + req.params.widgetId + '/login/' + req.params.loginType + '/callback');
}


var strategies = {
    'google': function (req) {
        return new GoogleStrategy({
            returnURL: _returnURL(req),
            realm: req.absoluteUrl('')
        }, function (identifier, profile, done) {
            logger.info('google profile', profile);
            done(null, profile);
        });
    },
    'linkedin': function (req) {
        return new LinkedInStrategy({
                consumerKey: conf.linkedIn.apiKey,
                consumerSecret: conf.linkedIn.secretKey,
                profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline'],

                callbackURL: _returnURL(req)
            },
            function (token, tokenSecret, profile, done) {
                logger.info('linkedin profile', profile);
                done(null, profile);
            }
        );
    },
    'facebook': function (req) {
        return new FacebookStrategy({
                clientID: conf.facebook.apiKey,
                clientSecret: conf.facebook.secretKey,
                callbackURL: _returnURL(req),
                enableProof: false
            },
            function (accessToken, refreshToken, profile, done) {
                done(null, profile);
            }
        );
    },

    'github': function (req) {
        return new GitHubStrategy({
                clientID: conf.github.apiKey,
                clientSecret: conf.github.secretKey,
                callbackURL: _returnURL(req)
            },
            function (accessToken, refreshToken, profile, done) {
                try {
                    if (!profile.hasOwnProperty('name')) {
                        profile.name = { };
                    }


                    var nameArgs;
                    // make sure profile has all info to continue;
                    // make sure it has family name
                    if (!profile.name.hasOwnProperty('familyName') || !profile.name.familyName) {
                        if (profile.hasOwnProperty('displayName') && !!profile.displayName) {
                            nameArgs = profile.displayName.split(' ');
                            if (nameArgs.length > 0) {
                                profile.name.familyName = nameArgs[1];
                            } else {
                                profile.name.familyName = '';
                            }
                        } else {
                            profile.name.familyName = '';
                        }
                    }

                    // make sure it has first name;
                    if (!profile.name.hasOwnProperty('givenName') || !profile.name.givenName) {
                        if (profile.hasOwnProperty('displayName') && !!profile.displayName) {
                            nameArgs = profile.displayName.split(' ');
                            if (nameArgs.length > 0) {
                                profile.name.givenName = nameArgs[0];
                            } else {
                                profile.name.givenName = '';
                            }
                        } else {
                            profile.name.givenName = '';
                        }
                    }


                    // check if email exists, otherwise query it.
                    if (profile.hasOwnProperty('emails') && !!profile.emails && profile.emails.hasOwnProperty('length') && profile.emails.length > 0 && profile.emails[0].hasOwnProperty.value && !!profile.emails[0].value) {
                        done(null, profile);
                        return;
                    }

                    // query for emails


                    var args = {
                        parameters: {'client_id': conf.github.apiKey, 'client_secret': conf.github.secretKey, 'access_token': accessToken},
                        headers: {'Content-Type': 'application/json', 'User-Agent': 'Cloudify-Widget-App'}
                    };

                    logger.info('getting emails');
                    client.get('https://api.github.com/user/emails', args,
                        function (data/*, response*/) {
                            if (typeof(data) === 'string') {
                                data = JSON.parse(data);
                            }
                            // parsed response body as js object
                            profile.emails = [
                                { 'value': data[0].email }
                            ];
                            done(null, profile);

                            // raw response
//                        console.log(response);
                        }).on('error', function (err) {
                            logger.error(err);
                            throw err;
                        });
                } catch (e) {
                    logger.err(e);
                    throw e;
                }

            }
        );
    },
    'custom': function (/*req*/) {
        return new CustomStrategy(
            {},
            function (profile) {
                logger.info(profile);
            }
        );
    }
};

var authenticateParams = {
    'linkedin': { scope: ['r_basicprofile', 'r_emailaddress'] },
    'facebook': { scope: ['email'] },
    'github': { scope: ['user', 'user:email']},
    'custom': function (req) {
        return { 'failureRedirect': '/#/widgets/' + req.params.widgetId + '/login/custom' };
    }
};

// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
//     /auth/google/return
exports.widgetLogin = function (req, res, next) {
    var widgetId = req.params.widgetId;
    var loginType = req.params.loginType;

    if (!strategies.hasOwnProperty(loginType)) {
        throw new Error('strategy :: ' + loginType + ' is not defined');
    }

    logger.info('defining', 'widget-' + widgetId + '-' + loginType);
    passport.use('widget-' + widgetId + '-' + loginType, strategies[loginType](req));

    if (authenticateParams.hasOwnProperty(loginType)) {
        var scopeParams = authenticateParams[loginType];
        if (typeof(scopeParams) === 'function') {
            scopeParams = scopeParams(req);
        }
        passport.authenticate('widget-' + widgetId + '-' + loginType, scopeParams)(req, res, next);
    } else {
        passport.authenticate('widget-' + widgetId + '-' + loginType)(req, res, next);
    }
};


exports.getTypes = function (req, res/*, next */) {
    res.send(managers.widgetLogins.getLoginTypes());
};

var closePopupResponse = '<html><body><script>window.opener.$windowScope.loginDone("__id__");</script></body></html>';

function _loginCallback(req, res) {
    return function (err, loginModel) {
        if (!!err) {
            err.send(res);
            return;
        }

        if (!loginModel) {
            res.send(500, 'internal error problem');
            return;
        }

        res.send(200, closePopupResponse.replace('__id__', loginModel._id));
    };
}

// Google will redirect the user to this URL after authentication.  Finish
// the process by verifying the assertion.  If valid, the user will be
// logged in.  Otherwise, authentication has failed.
exports.widgetLoginCallback = function (req, res, next) {
    var loginType = req.params.loginType;
    logger.info('authorizing', 'widget-' + req.params.widgetId + '-' + loginType);
    passport.authorize('widget-' + req.params.widgetId + '-' + loginType)(req, res, function () {
        logger.info('this is account', req.account);

        try {
            var loginDetails = { 'name': req.account.name.givenName, 'lastName': req.account.name.familyName, 'email': req.account.emails[0].value};

            managers.widgetLogins.handleWidgetLogin(loginType, req.params.widgetId, loginDetails, _loginCallback(req, res));
        } catch (e) {
            next(e);
        }
    });
};

//
//exports.twitterLogin = function ( req, res, next ){
//    var widgetId = req.params.widgetId;
//
//    passport.use(new TwitterStrategy({
//            consumerKey: conf.twitter.apiKey,
//            consumerSecret: conf.twitter.secretKey,
//            callbackURL: req.absoluteUrl('/backend/widgets/' + widgetId + '/login/twitter/callback')
//        },
//        function(token, tokenSecret, profile, done) {
//            logger.info('twitter function was called');
//
//        }
//    ));
//
//    passport.authenticate('twitter')( req, res, next );
//};
//
//
//exports.twitterLoginCallback = function( req, res ){
//    res.send(req.query);
//};


exports.getAllLogins = function (req, res) {
    managers.widgetLogins.getWidgetLogins(req.user._id, function (err, result) {
        if (!!err) {
            res.send(500, err.message);
            return;
        }
        res.send(result);
    });
};