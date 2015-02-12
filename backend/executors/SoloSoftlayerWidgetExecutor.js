/**
 * Created by sefi on 28/01/15.
 */
'use strict';

var util = require('util');
var path = require('path');
var logger = require('log4js').getLogger('SoloSoftlayerWidgetExecutor');
var managers = require('../managers');
var services = require('../services');
//var fs = require('fs');
var fse = require('fs-extra');
var childProcess = require('child_process');
var _ = require('lodash');
var async = require('async');
var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');

function SoloSoftlayerWidgetExecutor() {
    AbstractWidgetExecutor.call(this);
}

util.inherits(SoloSoftlayerWidgetExecutor, AbstractWidgetExecutor);

var env = 'softlayer_widget';

function spawn(env, cmd/*, args, callback*/) {
    var args, callback, stderr, stdout;

    if(typeof arguments[2] === 'function') {
        args = {};
        callback = arguments[2];
    } else {
        args = arguments[2];
        callback = arguments[3];
    }

    var exec = childProcess.spawn('bash', ['-c', 'source ' + path.resolve(env) + '/bin/activate; ' + cmd], args || {});

    exec.stdout.on('data', function (data) {
        //logger.trace('stdout: ' + data);
        if (!stdout) {
            stdout = '';
        }
        stdout += data;
    });

    exec.stderr.on('data', function (data) {
        //logger.trace('stderr: ' + data);
        if (!stderr) {
            stderr = '';
        }
        stderr += data;
    });

    exec.on('close', function (/*code*/) {
        callback(stderr, stdout);
        exec.stdin.end();
    });

    return exec;
}

//-----------  Private tasks  ----------------------
/**
 * Push process stdout and stderr outputs to DB.
 *
 * @param executionModel
 * @param childProcess
 */
function listenOutput (executionModel, childProcess) {
    managers.db.connect('widgetExecutions', function (db, collection) {
        function handleLines(type) {
            return function (lines) {
                lines = _.map(lines, function (line) {
                    logger.trace(type + ' :: [' + line + ']');
                    return {'type': type, 'line': line};
                });
                collection.update({_id: executionModel.getExecutionObjectId()}, {$push: {'output': {$each: lines}}}, function () {
                });
            };
        }

        new services.GsReadline(childProcess.stdout).on('lines', handleLines('info'));
        new services.GsReadline(childProcess.stderr).on('lines', handleLines('error'));
    });

}

/**
 * noop callback
 *
 * @param executionModel
 * @param callback
 * @returns {Function}
 */
function noOutputCallback(executionModel, callback) {
    return function (err) {
        callback(err, executionModel);
    };
}

/**
 * Initialize waterfall for softlayer solo
 *
 * @param executionModel
 * @param callback
 */
SoloSoftlayerWidgetExecutor.prototype.soloSoftlayerInit = function (executionModel, callback) {
    var executionDetails = executionModel.getExecutionDetails();
    executionDetails = _.merge({'configPrototype': path.resolve(__dirname, '..', 'cfy-config-softlayer')}, executionDetails);
    executionModel.setExecutionDetails(executionDetails);

    callback(null, executionModel);
};

//SoloSoftlayerWidgetExecutor.prototype.setupVirtualenv = function (executionModel, callback) {
//    fs.exists('softlayer_widget/bin/activate', function (exists) {
//        if (!exists) {
//            logger.error('must have virtualenv configured');
//            callback(new Error('Must have virtualenv configured.'), executionModel);
//            return;
//        }
//
//        logger.debug('[setupVirtualenv] virtual env already setup.');
//
//        exec('bash -c "source softlayer_widget/bin/activate"', function (err, stdout) {
//            if (err) {
//                logger.error('could not setup virtualenv', err);
//                callback(err, executionModel);
//                return;
//            }
//
//            logger.debug('setup virtualenv success: ', stdout);
//            callback(null, executionModel);
//        });
//    });
//
//};

SoloSoftlayerWidgetExecutor.prototype.setupDirectory = function (executionModel, callback) {

    //callback = callback || _.noop;

    logger.debug('[setupDirectory] copying config files to temp folder');
    var tmpDirName = path.resolve(__dirname, '..', 'cp_' + executionModel.getExecutionId());
    executionModel.setDownloadsPath(tmpDirName);

    fse.copy(executionModel.getExecutionDetails().configPrototype, tmpDirName, function (err) {
        if (err) {
            logger.error('[setupDirectory] failed at copying config files to temp folder', err);
            callback(err, executionModel);
            return;
        }

        // fill in paths to be reused
        var commands = {
            initCommand: util.format('cfy local init -p %s/blu_sl_blueprint.yaml --install-plugins -i %s/blu_sl.json', tmpDirName, tmpDirName),
            installWfCommand: 'cfy local execute -w install'
        };
        executionModel.setCommands(commands);
        logger.debug('[setupDirectory] configuration update. now it is \n', JSON.stringify(executionModel.getCommands(), {}, 4));

        callback(null, executionModel);
    });
};

SoloSoftlayerWidgetExecutor.prototype.setupEnvironmentVariables = function (executionModel, callback) {
    var executionDetails = executionModel.getExecutionDetails();
    process.env.SL_USERNAME = executionDetails.softlayer.params.username;
    spawn(env, 'echo $SL_USERNAME', {env: process.env}, function (err, stdout) {
        if (err) {
            logger.error('[setupEnvironmentVariables] could not set environment variable: SL_USERNAME');
            callback(err, executionModel);
            return;
        }
        logger.debug('[setupEnvironmentVariables] this is the USERNAME: ', stdout);

        process.env.SL_API_KEY = executionDetails.softlayer.params.apiKey;
        spawn(env, 'echo $SL_API_KEY', {env: process.env}, function (err, stdout) {
            if (err) {
                logger.error('[setupEnvironmentVariables] could not set environment variable: SL_API_KEY');
                callback(err, executionModel);
                return;
            }
            logger.debug('[setupEnvironmentVariables] this is the API_KEY: ', stdout);
            callback(null, executionModel);
        });
    });
};

SoloSoftlayerWidgetExecutor.prototype.setupSoftlayerCli = function (executionModel, callback) {
    spawn(env, 'sudo pip install softlayer', function (err, stdout) {
        if (err) {
            logger.error('[setupSoftlayerCli] error while installing softlayer CLI : ' + err);
            callback(new Error('failed to install softlayer CLI:\n' + stdout), executionModel);
            return;
        }

        logger.debug('[setupSoftlayerCli] stdout: ' + stdout);
        callback(null, executionModel);
    });
};

SoloSoftlayerWidgetExecutor.prototype.setupSoftlayerSsh = function (executionModel, callback) {
    logger.debug('[setupSoftlayerSsh] running setup for softlayer ssh');
    var executionId = executionModel.getExecutionId();
    logger.debug('[setupSoftlayerSsh] your random key: ' + executionId);

    // inner waterfall tasks:
    function createKeyPairs (innerCallback) {
        logger.debug('[setupSoftlayerSsh] Trying to create keypairs ...');
        spawn(env, 'ssh-keygen -t rsa -N "" -f ' + executionId, function (err, output) {
            if (err) {
                logger.error('[setupSoftlayerSsh] failed creating ssh keys: ' + err);
                innerCallback(new Error('failed creating ssh keys'));
                return;
            }

            logger.debug('[setupSoftlayerSsh] success! ' + output);
            innerCallback();
        });
    }

    function addSshKey (innerCallback) {
        logger.debug('[setupSoftlayerSsh] Trying to add SSH key to Softlayer...');
        spawn(env, 'sl sshkey add -f ' + process.cwd() + '/' + executionId + '.pub' + ' ' + executionId, function (err, output) {
            if (err) {
                logger.error('[setupSoftlayerSsh] failed adding ssh key to softlayer: ' + err + output);
                innerCallback(new Error('failed adding ssh key to softlayer'));
                return;
            }

            logger.debug('[setupSoftlayerSsh] success! ' + output);
            innerCallback();
        });
    }

    function updateExecutionModel (innerCallback) {
        logger.debug('[setupSoftlayerSsh] Verifying...');
        spawn(env, 'sl sshkey list', function (err, output) {
            if (err) {
                logger.error('[setupSoftlayerSsh] failed running sshkey list on softlayer cli', err);
                innerCallback(err);
                return;
            }

            if (!output) {
                logger.error('[setupSoftlayerSsh] expected output from sl sshkey list command but got nothing');
                innerCallback(new Error('missing output from sshkey list command'));
                return;
            }

            logger.trace('[setupSoftlayerSsh] got sshkey list output', output);

            var line = _.find(output.split('\n'), function (line) {
                return line.indexOf(executionId) >= 0;
            });

            if (!line) {
                logger.error('[setupSoftlayerSsh] expected to find a line with ', +executionId + ' but could not find one. all I got was, ', output);
                innerCallback(new Error('could not find line with id' + executionId + '. unable to get key id'));
                return;
            }

            logger.debug('[setupSoftlayerSsh] line ' + line);
            var keyId = line.split(' ', 1);

            if (keyId.length === 0) {
                logger.info('[setupSoftlayerSsh] keyId is an empty array - length is: ' + keyId);
                innerCallback(new Error('could not find the keyId on keyId[0]'));
                return;
            }

            logger.info('[setupSoftlayerSsh] got the keyId: ' + keyId);
            var idAsNumber = Number(keyId);
            logger.info('[setupSoftlayerSsh] got the idAsNumber: ' + idAsNumber);

            executionModel.setSshKey(idAsNumber);

            innerCallback();
        });
    }

    function innerFinally (err) {
        if (err) {
            callback(err, executionModel);
            return;
        }

        callback(null, executionModel);
    }

    var tasks = [
        createKeyPairs,
        addSshKey,
        updateExecutionModel
    ];

    async.waterfall(tasks, innerFinally);
};

/*jshint camelcase: false */
SoloSoftlayerWidgetExecutor.prototype.editInputsFile = function (executionModel, callback) {
    logger.debug('[editInputsFile] editing blu_sljson .. ');

    var executionId = executionModel.getExecutionId();
    var executionDetails = executionModel.getExecutionDetails();
    var inputsFile = path.join(executionModel.getDownloadsPath(), 'blu_sl.json');
    logger.debug('[editInputsFile] inputsFile path is : ', inputsFile);

    var softlayerInputs = require(inputsFile);
    logger.debug('[editInputsFile] softlayerInputs: ', softlayerInputs);

    softlayerInputs.username = executionDetails.softlayer.params.username;
    softlayerInputs.api_key = executionDetails.softlayer.params.apiKey;

    softlayerInputs.ssh_keys = executionModel.getSshKey();
    logger.debug('[editInputsFile] ssh_keys ', executionModel.getSshKey());
    softlayerInputs.ssh_key_filename = process.cwd() + '/' + executionId;

    logger.debug('[editInputsFile] softlayerInputs after setting inputs: ', softlayerInputs);
    logger.debug('[editInputsFile] writing to input file .. ', 'blu_sl ' + softlayerInputs);
    fse.writeJSONFile(inputsFile, softlayerInputs, function (err) {
        if (err) {
            logger.error(err);
            callback(err, executionModel);
            return;
        }

        logger.info('[editInputsFile] softlayerInputs file successfully updated');
        callback(null, executionModel);
    });
};

SoloSoftlayerWidgetExecutor.prototype.runInitCommand = function (executionModel, callback) {
    var initCommand = executionModel.getCommands().initCommand;

    logger.debug('[runInitCommand] initializing..  ' + initCommand);
    spawn(env, 'echo $SL_USERNAME', {env: process.env}, function (err, stdout) {
        if (err) {
            logger.error('[runInitCommand] could not set environment variable: SL_USERNAME');
            callback(err, executionModel);
            return;
        }
        logger.debug('[runInitCommand] this is the USERNAME: ', stdout);
        listenOutput(executionModel, spawn(env, initCommand, noOutputCallback(executionModel, callback)));
    });
};

SoloSoftlayerWidgetExecutor.prototype.runInstallWorkflowCommand = function (executionModel, callback) {
    var installWfCommand = executionModel.getCommands().installWfCommand;

    logger.debug('[runInstallWorkflowCommand] installing workflow: ' + installWfCommand);

    // this.listenOutput(childProcess.exec(conf.installWfCommand, noOutputCallback(callback) ));
    spawn(env, installWfCommand, function (err, output) {
        logger.trace('[runInstallWorkflowCommand] cfy install ef command output: ' + output);

        if (err) {
            logger.error('[runInstallWorkflowCommand] failed running install workflow command');
            callback(new Error('failed running install workflow command'), executionModel);
            return;
        }

        callback(null, executionModel);
    });
};

//-----------  Private tasks end  ----------------------

//-----------  Overrides  ----------------------

SoloSoftlayerWidgetExecutor.prototype.executionType = 'Solo Softlayer';

SoloSoftlayerWidgetExecutor.prototype.getExecutionTasks = function () {
    return [
        this.soloSoftlayerInit.bind(this),
        this.getWidget.bind(this),
        this.saveExecutionModel.bind(this),
        //this.setupVirtualenv,
        this.setupDirectory.bind(this),
        this.setupEnvironmentVariables.bind(this),
        this.setupSoftlayerCli.bind(this),
        this.setupSoftlayerSsh.bind(this),
        this.editInputsFile.bind(this),
        this.runInitCommand.bind(this),
        this.runInstallWorkflowCommand.bind(this)
    ];
};

//-----------  Overrides END ----------------------


module.exports = SoloSoftlayerWidgetExecutor;
