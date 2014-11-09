'use strict';

var logger = require('log4js').getLogger('WidgetManager');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var async = require('async');
var services = require('../services');
var managers = require('../managers');
var conf = require('../Conf');
var models = require('../models');


/**
 *
 *
 *  This class takes care of playing a widget
 *
 *
 *  it uses the async library and maintains 'curry params' for each request.
 *
 *  this 'curry params' look like so:
 *
 *
 *  {
 *
 *      'widgetId' : 'the widget id',
 *      'widget' : 'the widget untouched',
 *      'poolKey' : 'the pool key',
 *      'executionObjectId' : 'the execution object id',
 *      'executionId' : 'the execution id as string',
 *      'executionDownloadsPath' : 'the download path to download stuff to',
 *      'executionLogsPath' : 'the logs path for the execution'
 *      'shouldInstall' : 'whether or not we should install',
 *      'nodeModel' : 'the node model we are occupying',
 *
 *
 *      'cloudDistFolderName' : 'the clouds folder inside cloudify',
 *      'cloudDistFolder' : 'the clouds folder',
 *      'advancedParams' : 'adavnced params to send to the cloud properties'
 *
 *      'stopCallback' : 'callback for stop',
 *      'executionModel' : 'the execution model',
 *      'playCallback' : 'callback for playing'
 *
 *  }
 *
 *
 *
 *
 *
 */


/**
 *
 *
 *  if specified on curry params:
 *      - Send email after installation.
 *      - update execution model whether email sent successfully or not.
 *
 */
function sendEmailAfterInstall(curryParams){
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
                } else {
                    curryParams.widget.socialLogin.handlers.mandrill.status = result;
                }
            });

    });


}

function getTempSuffix() {
    var currTime = '' + new Date().getTime();
    return currTime.substring(currTime.length - 4);
}

function _getWidget(curryParams, curryCallback) {
    logger.trace('-play- getWidget');
    managers.db.connect('widgets', function (db, collection, done) {
        collection.findOne({ _id: managers.db.toObjectId(curryParams.widgetId) }, function (err, result) {
            if (!!err) {
                logger.error('unable to find widget', err);
                curryCallback(err, curryParams);
                done();
                return;
            }

            if (!result) {
                logger.error('result is null for widget find');
                curryCallback(new Error('could not find widget'), curryParams);
                done();
                return;
            }

            curryParams.widget = result;
            curryCallback(null, curryParams);
            done();
        });
    });
}

function _getPoolKey(curryParams, curryCallback) {
    logger.info('getting user from widget');
    managers.db.connect('users', function (db, collection) {
        collection.findOne({ '_id': curryParams.widget.userId }, function (err, result) {
            if (!!err) {
                logger.error('unable to find user from widget', err);
                curryCallback(err, curryParams);
                return;
            }

            if (!result) {
                logger.error('result is null for widget');
                curryCallback(new Error('could not find user for widget'), curryParams);
                return;
            }

            logger.info('found poolKey', result.poolKey);
            curryParams.poolKey = result.poolKey;
            curryCallback(null, curryParams);
        });
    });
}

function _createExecutionModel(curryParams, curryCallback) {
    logger.trace('-play- createExecutionModel');
    managers.db.connect('widgetExecutions', function (db, collection, done) {
        // instantiate the execution model with the widget data, and remove the _id - we want mongodb to generate a unique id
        var executionModel = {};
        executionModel.widget = curryParams.widget;
        executionModel.loginDetailsId = curryParams.loginDetailsId;
        executionModel.state = 'RUNNING';

        collection.insert(executionModel, function (err, docsInserted) {
            if (!!err) {
                logger.error('failed creating widget execution model', err);
                curryCallback(err, curryParams);
                done();
                return;
            }
            if (!docsInserted) {
                logger.error('no widget execution docs inserted to database');
                curryCallback(new Error('no widget execution docs inserted to database'), curryParams);
                done();
                return;
            }
            curryParams.executionObjectId = docsInserted[0]._id;
            curryCallback(null, curryParams);
            done();
        });
    });
}

function _updateExecutionModel(data, curryParams, curryCallback) {

    managers.db.connect('widgetExecutions', function (db, collection, done) {
        collection.update(
            { _id: curryParams.executionObjectId },
            {
                $set: data
            },
            function (err, nUpdated) {
                if (!!err) {
                    logger.error('failed updating widget execution model', err);
                    curryCallback(err, curryParams);
                    done();
                    return;
                }
                if (!nUpdated) {
                    logger.error('no widget execution docs updated in the database');
                    curryCallback(new Error('no widget execution docs updated in the database'), curryParams);
                    done();
                    return;
                }
                curryCallback(null, curryParams);
                done();
            });
    });
}

function _updateExecutionModelAddPaths(curryParams, curryCallback) {
    logger.trace('-play- updateExecutionModelAddPath');

    curryParams.executionId = curryParams.executionObjectId.toHexString();
    curryParams.executionDownloadsPath = path.join(conf.downloadsDir, curryParams.executionId);
    curryParams.executionLogsPath = path.join(conf.logsDir, curryParams.executionId);

    _updateExecutionModel({
        downloadsPath: curryParams.executionDownloadsPath,
        logsPath: curryParams.executionLogsPath
    }, curryParams, curryCallback);
}

function _updateExecutionModelAddNodeModel(curryParams, curryCallback) {
    logger.trace('-play- updateExecutionModelAddNodeModel');

    _updateExecutionModel({
        nodeModel: curryParams.nodeModel
    }, curryParams, curryCallback);
}


function _downloadRecipe(curryParams, curryCallback) {
    logger.trace('-play- downloadRecipe');

    // TODO : add validation if destination download not already exists otherwise simply call callback.
    logger.info('downloading recipe from ', curryParams.widget.recipeUrl);
    // download recipe zip
    var options = {
        destDir: curryParams.executionDownloadsPath,
        recipeUrl: curryParams.widget.recipeUrl
    };

    if (!options.recipeUrl) {
        curryParams.shouldInstall = false;
        curryCallback(null, curryParams);

    } else {
        curryParams.shouldInstall = true;
        services.dl.downloadRecipe(options, function (e) {
            curryCallback(e, curryParams);
        });

    }
}

function _occupyMachine(curryParams, curryCallback) {
    logger.trace('-play- occupyMachine');

    // TODO better defense
    var expires = Date.now() + ( ( curryParams.widget.installTimeout || 20 ) * 60 * 1000); //  default to 20 minutes
    logger.info('installation will expire within [%s] minutes - at [%s], or [%s] epoch time', curryParams.widget.installTimeout, Date(expires), expires);

    managers.poolClient.occupyPoolNode(curryParams.poolKey, curryParams.widget.poolId, expires, function (err, result) {

        if (!!err) {
            logger.error('occupy node failed');
            curryCallback(err, curryParams);
            return;
        }

        if (!result) {
            logger.error('occupy node result is null');
            curryCallback(new Error('We\'re so hot, that all machines are occupied! Please try again in a few minutes.'), curryParams);
            return;
        }

        var resultObj = result; // todo: callbackWrapper makes this obsolete
        if (typeof result === 'string') {
            try {
                resultObj = JSON.parse(result);
            } catch (e) {
                curryCallback(e, curryParams);
            }
        }

        curryParams.nodeModel = resultObj;

        curryCallback(null, curryParams);
    });
}

function _runInstallCommand(curryParams, curryCallback) {
    logger.trace('-play- runInstallCommand');

    if (!curryParams.shouldInstall) {
        var status = {'code' : 0};

        services.logs.writeStatus(JSON.stringify(status, null, 4) + '\n', curryParams.executionId);
        services.logs.appendOutput('Install finished successfully.\n', curryParams.executionId);

        sendEmailAfterInstall( curryParams );

        curryCallback(null, curryParams);
        return;
    }

    // else - !!curryParams.shouldInstall

    var installPath = curryParams.executionDownloadsPath;
    if (!!curryParams.widget.recipeRootPath) {
        try {
            installPath = path.join(curryParams.executionDownloadsPath, curryParams.widget.recipeRootPath || ' ');
        } catch (e) {
            curryCallback(new Error('failed while joining install path, one or more of the parameters is not a string: [' +
                curryParams.executionDownloadsPath + '] [' + curryParams.widget.recipeRootPath + ']'), curryParams);
            return;
        }
    }

    var command = {
        arguments: [
            'connect',
            curryParams.nodeModel.machineSshDetails.publicIp,
            ';',
            models.recipeType.getById(curryParams.widget.recipeType).installCommand,
            installPath
        ],
        logsDir: curryParams.executionLogsPath,
        executionId: curryParams.executionObjectId.toHexString()
    };
    // we want to remove the execution model when the execution is over
    services.cloudifyCli.executeCommand(command, function (exErr/*, exResult*/) {
        if (!!exErr) {
            logger.error('error while running install from cli',exErr);
            return;
        }

        sendEmailAfterInstall( curryParams );
        // TODO change execution status
    });

    curryCallback(null, curryParams);
}

function _copyCloudFolder(curryParams, curryCallback) {
    logger.trace('-play- copyCloudFolder');

    logger.debug('copyCloudFolder, widget:', curryParams.widget);
    var cloudifyCloudsDir = conf.cloudifyCloudsDir;
    logger.debug('cloudifyCloudsDir:', cloudifyCloudsDir);
    var cloudName = curryParams.widget.remoteBootstrap.cloudifyCloud;
    logger.debug('cloudName:', cloudName);
    var cloudSourceFolder = cloudifyCloudsDir + path.sep + cloudName;
    var suffix = getTempSuffix();
    logger.debug('suffix:', suffix);
    curryParams.cloudDistFolderName = curryParams.widget.remoteBootstrap.cloudifyCloud + suffix;
    var cloudDistFolder = cloudifyCloudsDir + path.sep + curryParams.cloudDistFolderName;
    curryParams.cloudDistFolder = cloudDistFolder;
    logger.debug('cloudSourceFolder:', cloudSourceFolder, ', cloudDistFolder', cloudDistFolder, 'cloudDistFolderName', curryParams.cloudDistFolderName);

    var ncp = require('ncp').ncp;
    ncp.limit = 16;

    ncp(cloudSourceFolder, cloudDistFolder, function (err) {
        if (!!err) {
            logger.info(err);
            return;
        }
        logger.info('Folder [%s] was successfully copied into [%s]', cloudSourceFolder, cloudDistFolder);
        curryCallback(null, curryParams);
    });
}

function _overrideCloudPropertiesFile(curryParams, curryCallback) {
    logger.trace('-play- overrideCloudPropertiesFile');

    var cloudName = curryParams.widget.remoteBootstrap.cloudifyCloud;
    var cloudPropertiesFile = curryParams.cloudDistFolder + path.sep + cloudName + '-cloud.properties';
    var advancedParams = curryParams.advancedParams;
    logger.info('Cloud Properties File is ', cloudPropertiesFile, 'advancedParams=', curryParams.advancedParams);

    //overrideParams( curryParams.cloudDistFolderName, cloudPropertiesFile, curryParams.advancedParams, curryCallback );
    logger.info('---overrideParams---, -advancedParams:', advancedParams);

    var updateLine = '';
    if (advancedParams.SOFTLAYER) {
        var username = advancedParams.SOFTLAYER.params.username;
        var apiKey = advancedParams.SOFTLAYER.params.apiKey;
        updateLine =
            'user=' + username + '\n' +
            'apiKey="' + apiKey + '"';
    }
    else if (advancedParams.HP) {
        var key = advancedParams.HP.params.key;
        var secretKey = advancedParams.HP.params.secretKey;
        var project = advancedParams.HP.params.project;
        updateLine =
            'tenant="' + project + '"\n' +
            'user="' + key + '"\n' +
            'apiKey="' + secretKey + '"';
        /*
         'keyFile="' + newPemFile.getName() + '.pem"';
         'keyPair="' + newPemFile.getName() + '"';
         'securityGroup="' + cloudConf.securityGroup + '"';
         */
    }

    logger.info('---updateLine', updateLine);

    fs.appendFile(cloudPropertiesFile, updateLine, function (err) {

        if (!!err) {
            logger.info(err);
            curryCallback(err, curryParams);
        }
        logger.info('Cloud Properties File was updated:', cloudPropertiesFile);

        curryCallback(null, curryParams);
    });

}

function _runBootstrapAndInstallCommands(curryParams, curryCallback) {
    logger.info('-playRemote- runCliBootstrapCommand, executionLogsPath:', curryParams.executionLogsPath, 'installCommand:', curryParams.widget.recipeType.installCommand);
    logger.info('-playRemote- runCliBootstrapCommand, executionDownloadsPath:', curryParams.executionDownloadsPath, 'recipeRootPath:', curryParams.widget.recipeRootPath);

    var installPath = path.resolve(path.join(curryParams.executionDownloadsPath, curryParams.widget.recipeRootPath));
    var installTimeout = curryParams.widget.installTimeout;

    logger.info('-playRemote waterfall- installTimeout:', installTimeout);

    logger.info('-playRemote waterfall- runCliBootstrapCommand, JOIN:', installPath);
    logger.info('-installPath after handlingseparators:', installPath);
    var command = {
        arguments: [
            'bootstrap-cloud',
            curryParams.cloudDistFolderName,
            ';',
            curryParams.widget.recipeType.installCommand,
            '-timeout',
            installTimeout,
            installPath
        ],
        logsDir: curryParams.executionLogsPath,
        executionId: curryParams.executionObjectId.toHexString()
    };

    logger.info('-command', command);

    services.cloudifyCli.executeCommand(command);

    curryCallback(null, curryParams);
}


function _playFinally(err, curryParams) {


    if (!!err) {
//        logger.error('failed to play widget with id [%s]', curryParams.widgetId);
        managers.db.connect('widgetExecutions', function (db, collection, done) {
            collection.update(
                { _id: curryParams.executionObjectId },
                {
                    $set: {
                        state: 'STOPPED',
                        error: err.message
                    }
                },
                function (err, nUpdated) {
                    if (!!err) {
                        logger.error('failed updating widget execution model', err);
                        done();
                        return;
                    }
                    if (!nUpdated) {
                        logger.error('no widget execution docs updated in the database');
                        done();
                        return;
                    }
                    done();
                });
        });

        curryParams.playCallback(err, curryParams.executionId);
        return;
    }
    logger.trace('-play- finished !');
//    logger.info('result is ', curryParams);

    curryParams.playCallback(null, curryParams.executionObjectId.toHexString());
}

function _getExecutionModel(curryParams, curryCallback) {


    managers.db.connect('widgetExecutions', function (db, collection, done) {
        collection.findOne({_id: managers.db.toObjectId(curryParams.executionId)}, function (err, result) {

            if (!!err) {
                curryCallback(err, curryParams);
                done();
                return;
            }

            if (!result) {
                curryCallback(new Error('could not find execution model'), curryParams);
                done();
                return;
            }

            curryParams.executionModel = result;
            curryCallback(null, curryParams);
            done();
        });
    });
}

function _expireNode(curryParams, curryCallback) {
    if (!curryParams.executionModel.nodeModel) {
        // nothing to expire
        curryCallback(null, curryParams);
        return;
    }

    managers.poolClient.expirePoolNode(curryParams.poolKey, curryParams.executionModel.widget.poolId, curryParams.executionModel.nodeModel.id, function (err/*, result*/) {

        if (!!err) {
            curryCallback(err, curryParams);
            return;
        }

        curryCallback(null, curryParams);
    });
}


function _stopFinally(err, curryParams) {
    logger.trace('-stop- finished !');
//    logger.info('result is ', curryParams);

    if (!!err) {
        logger.error('failed to stop widget with id [%s]', curryParams.widgetId);
        curryParams.stopCallback(err);
        return;
    }

    curryParams.stopCallback(null, {});
}

exports.play = function (widgetId, loginDetailsId, playCallback) {

    async.waterfall([

            function initCurryParams(callback) {
                var initialCurryParams = {
                    widgetId: widgetId,
                    loginDetailsId: loginDetailsId,
                    playCallback: playCallback
                };
                callback(null, initialCurryParams);
            },
            _getWidget,
            _getPoolKey,
            _createExecutionModel,
            _updateExecutionModelAddPaths,
            _downloadRecipe,
            _occupyMachine,
            _updateExecutionModelAddNodeModel,
            _runInstallCommand
        ],

        _playFinally
    );
};


exports.playRemote = function (widgetId, poolKey, advancedParams, playCallback) {

    logger.trace('-playRemote !!!!!!');

    async.waterfall([

            function initCurryParams(callback) {
                var initialCurryParams = {
                    widgetId: widgetId,
                    poolKey: poolKey,
                    advancedParams: advancedParams,
                    playCallback: playCallback
                };
                callback(null, initialCurryParams);
            },
            _getWidget,
            _createExecutionModel,
            _updateExecutionModelAddPaths,
            _downloadRecipe,
            _copyCloudFolder,
            _overrideCloudPropertiesFile,
            _runBootstrapAndInstallCommands
        ],

        _playFinally
    );
};

exports.stop = function (widgetId, executionId, remote, stopCallback) {


    var tasks = [

        function initCurryParams(callback) {
            var initialCurryParams = {
                widgetId: widgetId,
                executionId: executionId,

                stopCallback: stopCallback
            };
            callback(null, initialCurryParams);
        },
        _getWidget,
        _getPoolKey,
        _getExecutionModel
    ];

    // if execution is not on a remote machine, the node is in the pool - add a task to expire it
    !remote && tasks.push(_expireNode);

    async.waterfall(
        tasks,
        _stopFinally
    );
};

function getPublicExecutionDetails(execution) {
    var retVal = {};
    retVal.widget =  _.omit(execution.widget, ['userId']);
    retVal.nodeModel =  execution.nodeModel ? _.merge(_.pick(execution.nodeModel, ['id']),
                             {'publicIp': execution.nodeModel.machineSshDetails.publicIp },
                             {'expires': execution.nodeModel.expires}) : undefined;
    retVal.exitStatus = execution.exitStatus;
    retVal.output = execution.output;
    if (execution.error) {
        retVal.error = execution.error;
    }

    return retVal;
}

exports.getStatus = function (executionId, callback) {
    logger.debug('getting status', callback);
    managers.db.connect('widgetExecutions', function (db, collection) {
        collection.findOne({_id: managers.db.toObjectId(executionId)}, function (err, execution) {
//            logger.debug('get status result: ', result);
            if (!!err) {
                callback(err);
                return;
            }

            if (!execution) {
                callback('execution not found', null);
                return;
            }

            // add the status from cli execution (0 or 1)..
            // if this exists on the execution status, we know execution ended.
            //
            logger.debug('reading status');
            services.logs.readStatus(executionId, function (err, exitStatus) {
                logger.debug('read status');
                if (!err && !!exitStatus) {
                    if (typeof( exitStatus) === 'string') {
                        exitStatus = JSON.parse(exitStatus);
                    }
                    execution.exitStatus = exitStatus;
                }
                services.logs.readOutput(executionId, function (err, output) {
                    execution.output = output;
                    logger.debug('getting public details');
                    var publicExecutionDetails = getPublicExecutionDetails(execution);
                    logger.debug('public details are', publicExecutionDetails);
                    callback(null, publicExecutionDetails);
                });
            });
        });
    });

};

exports.getOutput = function (executionId, callback) {
    services.logs.readOutput(executionId, callback);
};


exports.findById = function (widgetId, callback) {
    logger.info(widgetId);
    managers.db.connect('widgets', function (db, collection, done) {
        collection.findOne({ _id: managers.db.toObjectId(widgetId) }, function (err, result) {
            if (!!err) {
                logger.error('unable to find widget', err);
                done();
                callback(err);
                return;
            }

            if (!result) {
                logger.error('result is null for widget find');
                done();
                callback(new Error('could not find widget'));
                return;
            }
            done();
            callback(null, result);
        });
    });
};
