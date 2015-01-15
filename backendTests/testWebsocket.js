var express = require('express');
var server = require('http').createServer(app);
require('express-ws')(app, server);
var logger = require('log4js').getLogger('testWebsocket');




app.ws('/', function(ws, req) {
    ws.on('message', function(msg) {
        logger.info(msg);
    });

    ws.on('', function(){
        logger.info(arguments);
    });
    console.log('socket', req.testing);
});

var server = app.listen(3000, function(){
    logger.info('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});