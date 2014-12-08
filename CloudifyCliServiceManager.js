/**
 * Created by kinneretzin on 12/8/14.
 */

/**
 * Initialize the logger if needed
 */
var logger = require('log4js').getLogger('CloudifyCliServiceManager');
var conf = require('./backend/Conf');
if ( !!conf.log4js ){
    logger.info('configuring');
    require('log4js').configure(conf.log4js);
}

/**
 * Requires
 */
var managers = require('./backend/managers');
var _ = require('lodash');
var services = require('./backend/services');
var async = require('async');

/**
 * Process
 *   read commands to execute
 *   execute each command, and remove it from the db
 */
findInstallCommands(function(commands){
    if (commands == null) {
        process.exit();
    }

    async.each(commands, function(command,callback){
        // First remove it from the db so it wont be executed several times
        removeCommand(command, function(result){
            if (!result || result == null) {
                callback(new Error('Cant remove command from DB. aborting'));
            } else {
                runCommand(command, callback);
            }
        });
    }, function(err){
        if (err) {
            logger.error("Cannot execute commands. ", err);
        }
        process.exit();
    });
});


/**
 * Read install commands from the db
 * @param callback
 */
function findInstallCommands(callback) {
    managers.db.connect('widgetInstallCommands', function (db, collection, done) {

        collection.find({}).toArray(function(err,commands){
            if (!!err) {
                logger.error('failed reading commands from install executions', err);
                if (callback) callback(null);
                return;
            }
            if (!commands) {
                logger.error('no widget install execution docs were found in the database');
                if (callback) callback(null);
                return;
            }
            if (commands.length == 0) {
                logger.info('No widgets install commands to run at the moment');
                callback(null);
                return;
            }

            callback(commands);
        });
    });
}

function removeCommand(command,callback) {
    managers.db.connect('widgetInstallCommands', function (db, collection, done) {

        collection.remove(command,function(err,result){
            if (!!err) {
                logger.error('failed remove command from install commands doc', err);
               if (callback) callback(null);
                return;
            }
            if (callback) callback(result);
        });
    });

}

function runCommand(commandObj, callback) {
    var command = commandObj.command;
    var curryParams = commandObj.curryParams;

    services.cloudifyCli.executeCommand(command, function (exErr/*, exResult*/) {
        if (!!exErr) {
            logger.error('error while running install from cli',exErr);
            return;
        }

        if (curryParams) {
            sendEmailAfterInstall( curryParams , function(err){
                if (callback) callback(err);
            });
        } else {
            if (callback) callback();
        }
        // TODO change execution status
    });
}

/**
*
*
*  if specified on curry params:
*      - Send email after installation.
*      - update execution model whether email sent successfully or not.
*
*/
function sendEmailAfterInstall(curryParams,callback){
    if (!curryParams.widget.socialLogin || !curryParams.widget.socialLogin.handlers || !curryParams.widget.socialLogin.handlers.mandrill || !curryParams.widget.socialLogin.handlers.mandrill.enabled) {
        // noop
        return;
    }

    var mandrillConfig = curryParams.widget.socialLogin.handlers.mandrill;
    var publicIp = curryParams.nodeModel.machineSshDetails.publicIp;
    var link = '<a href="http://"' + publicIp + '> http://' + publicIp + '</a>';

    managers.widgetLogins.getWidgetLoginById(curryParams.loginDetailsId, function(err, result) {
        if (!!err) {
            logger.error('unable to find login details, email send failed', err);
            return;
        }

        if (!result) {
            logger.error('result is null for login details find, email send failed');
            return;
        }

        var fullname = result.loginDetails.name + ' ' + result.loginDetails.lastName;

        var data = {
            'apiKey': mandrillConfig.apiKey,
            'template_name': mandrillConfig.templateName,
            'template_content': [
                {
                    'name': 'link',
                    'content': link
                },
                {
                    'name': 'name',
                    'content': fullname
                },
                {
                    'name': 'randomValue',
                    'content': curryParams.nodeModel.randomValue
                },
                {
                    'name' : 'publicIp',
                    'content' : publicIp
                }
            ],
            'message': {
                'to':[
                    {
                        'email':result.loginDetails.email,
                        'name': fullname,
                        'type': 'to'
                    }
                ]
            },
            'async':true
        };

            services.mandrill.sendMandrillTemplate( data,
            function(err, result){
                if (!!err) {
                    curryParams.widget.socialLogin.handlers.mandrill.status = err;
                    if (callback) callback(err);
                } else {
                    curryParams.widget.socialLogin.handlers.mandrill.status = result;
                    if (callback) callback();
                }
            });

    });
}

