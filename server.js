'use strict';
/**
 * Module dependencies.
 */

var express = require('express');
var controllers = require('./backend/controllers');
var logger = require('log4js').getLogger('server');
var managers = require('./backend/managers');

var middleware = require('./backend/middleware');

var passport = require('passport');
var conf = require('./backend/Conf');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var errorHandler = require('errorhandler');

if ( !!conf.log4js ){
    logger.info('configuring');
    require('log4js').configure(conf.log4js);
}

var app = module.exports = express();

var domainModule = require('domain'),
    domain = domainModule.create();

domain.on('error', function (err) {
    console.error(err);
});

domain.run(function () {

    // Configuration
    var conf = require('./backend/Conf');
    logger.info(JSON.stringify(conf));

    if (!!conf.adminUser) {
        conf.adminUser.passwordConfirm = conf.adminUser.password;
        conf.adminUser.firstName = 'admin';
        conf.adminUser.lastName = 'admin';
        conf.adminUser.poolKey = conf.adminUser.poolKey;
        conf.adminUser.isAdmin = true;
        managers.users.createUser(conf.adminUser, function (err/*, user*/) {
            if (!!err && err.indexOf('exists') < 0) {
                logger.error('unable to create admin user ' + err);
            } else {
                logger.info('admin user created successfully');
            }
        });
    }


    app.use(middleware.requestInfo.origin);
    app.use(bodyParser());
    app.use(methodOverride());
    app.use(passport.initialize());
    app.use(cookieParser());
    logger.info('configuring express');
    app.use(cookieSession({ 'secret': 'somesecret' }));
    app.use('/backend/user', middleware.session.loggedUser);
    app.use('/backend/admin', middleware.session.loggedUser);
    app.use('/backend/admin', middleware.session.adminUser);

    app.all('*', errorHandler({ dumpExceptions: true, showStack: true }));

    // Routes
    app.post('/backend/signup', controllers.session.signup);
    app.post('/backend/login', controllers.session.login);
    app.post('/backend/logout', controllers.session.logout);
    app.get('/backend/user/widgets', controllers.widgets.list);
    app.post('/backend/user/widgets', controllers.widgets.create);
    app.post('/backend/user/widgets/:widgetId/delete', controllers.widgets.delete);
    app.get('/backend/user/widgets/:widgetId', controllers.widgets.read);
    app.post('/backend/user/widgets/:widgetId/update', controllers.widgets.update);


    // public urls for playing the widget
    app.post('/backend/widgets/:widgetId/play', controllers.widgets.play);
    app.post('/backend/widgets/:widgetId/executions/:executionId/stop', controllers.widgets.stop);
    app.get('/backend/widgets/:widgetId/executions/:executionId/status', controllers.widgets.getStatus);
//    app.get('/backend/user/widgets/:widgetId/executions/:executionId/output', controllers.widgets.getOutput);
// a route to check if user logged in. relies on middleware to do the actual verification.
    app.get('/backend/user/loggedIn', function (req, res) {
        res.send(managers.users.getPublicUserDetails(req.user));
    });

    app.get('/backend/admin/myUser', function (req, res) {
        res.send(req.user);
    });
    app.post('/backend/admin/myUser/setPoolKey', controllers.adminUsers.setAdminPoolKey);
    app.post('/backend/admin/myUser/testAdminPoolKey', controllers.adminUsers.testAdminPoolKey);
//app.get('/backend/admin/users', function(req, res){ res.send('hello world!')});
    app.get('/backend/admin/users', controllers.adminUsers.getAllUsers);
    app.post('/backend/admin/users', controllers.pool.createUsers);
    app.post('/backend/admin/users/:userId/setPoolKey', controllers.adminUsers.loadUser, controllers.adminUsers.setPoolKey);
    app.get('/backend/admin/pools', controllers.pool.adminReadPools);
    app.get('/backend/admin/pools/script', controllers.pool.adminReadPoolBootstrapScript);

    app.get('/backend/admin/accounts', controllers.pool.readAccounts);
    app.post('/backend/admin/accounts/:accountId/description', controllers.pool.adminSetAccountDescription);
    app.get('/backend/admin/accounts/:accountId/pools', controllers.pool.adminReadAccountPools);
    app.post('/backend/admin/accounts/:accountId/pools', controllers.pool.createAccountPool);
    app.get('/backend/admin/accounts/:accountId/pools/:poolId', controllers.pool.adminReadAccountPool);
    app.post('/backend/admin/accounts/:accountId/pools/:poolId', controllers.pool.updateAccountPool);
    app.post('/backend/admin/accounts/:accountId/pools/:poolId/delete', controllers.pool.deleteAccountPool);
    app.post('/backend/admin/accounts/:accountId/pools/:poolId/clean', controllers.pool.cleanAccountPool);

    app.get('/backend/admin/pools/status', controllers.pool.readPoolsStatus);
    app.get('/backend/admin/pools/:poolId/status', controllers.pool.readPoolStatus);

    app.get('/backend/admin/pools/:poolId/nodes', controllers.pool.readPoolNodes);
    app.post('/backend/admin/pools/:poolId/nodes', controllers.pool.createPoolNode);
    app.post('/backend/admin/pools/:poolId/nodes/:nodeId/delete', controllers.pool.deletePoolNode);
    app.post('/backend/admin/pools/:poolId/nodes/:nodeId/bootstrap', controllers.pool.bootstrapPoolNode);

    app.get('/backend/admin/pools/:poolId/errors', controllers.pool.readPoolErrors);
    app.post('/backend/admin/pools/:poolId/errors/delete', controllers.pool.deletePoolErrors);
    app.get('/backend/admin/pools/:poolId/tasks', controllers.pool.readPoolTasks);
    app.get('/backend/admin/pools/:poolId/tasks/:taskId/delete', controllers.pool.deletePoolTask);
    app.get('/backend/admin/pools/:poolId/decisions', controllers.pool.readPoolDecisions);
    app.post('/backend/admin/pools/:poolId/decisions/:decisionId/abort', controllers.pool.abortPoolDecision);
    app.post('/backend/admin/pools/:poolId/decisions/:decisionId/approved/:approved', controllers.pool.updatePoolDecisionApproval);

    app.get('/backend/admin/pools/:poolId/cloud/nodes', controllers.pool.readCloudNodes);

    app.get('/backend/user/account/pools', controllers.pool.accountReadPools);
    app.post('/backend/user/account/pools', controllers.pool.createPool);
    app.get('/backend/user/account/pools/script', controllers.pool.readPoolBootstrapScript);
    app.post('/backend/user/account/pools/:poolId', controllers.pool.updatePool);
    app.post('/backend/user/account/pools/:poolId/delete', controllers.pool.deletePool);
    app.get('/backend/user/account/pools/:poolId/status', controllers.pool.accountReadPoolStatus);
    app.get('/backend/user/account/pools/status', controllers.pool.accountReadPoolsStatus);


    app.get('/backend/widgets/:widgetId', controllers.widgets.getPublicInfo);
    app.get('/backend/widgets/login/types', controllers.widgetLogin.getTypes);
    app.get('/backend/widgets/:widgetId/login/:loginType', controllers.widgetLogin.widgetLogin);
    app.post('/backend/widgets/:widgetId/login/custom',
        function (req, res, next) {
            req.params.loginType = 'custom';
            next();
        },
        controllers.widgetLogin.widgetLogin,
        function (req, res) {
            res.send(200);
        }
    );
    app.get('/backend/widgets/:widgetId/login/:loginType/callback', controllers.widgetLogin.widgetLoginCallback);


    var widgetPort = process.argv[2] || 9001;
    var server = app.listen(widgetPort, function () {
        logger.info('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
    });


});