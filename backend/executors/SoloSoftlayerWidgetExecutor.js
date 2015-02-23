/**
 * Created by sefi on 28/01/15.
 */
'use strict';

var util = require('util');
var path = require('path');
var logger = require('log4js').getLogger('SoloSoftlayerWidgetExecutor');
var services = require('../services');
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

/**
 *
 * Wrapper for logging facilities. Will log using logger, services.logs.appendOutput or both.

 * @param output            the string to log
 * @param appendLogger            should output lo logger (true | false)
 * @param appendOutput      should output to logs service (true | false)
 * @param executionId       the executionId (optional if appendOutput is false or undefined)
 */
function log(output, appendLogger, appendOutput, executionId) {
    if (appendLogger) {
        logger.debug(output);
    }

    if (appendOutput) {
        services.logs.appendOutput('\n' + output, executionId);
    }
}

/**
 * Running softlayer CLI on Ubuntu and CentOS require different versions of pip and virtualenv.
 * On CentOS 6.3, simply upgrading the pip and virtualenv is not recommended as it can royally screw the OS basic operations like YUM etc.
 * See http://stackoverflow.com/questions/11492683/django-apache-mod-wsgi-no-module-named-importlib.
 *
 * So, we followed the procedure described in the link below to install both pip2.6 and pip2.7:
 * http://toomuchdata.com/2014/02/16/how-to-install-python-on-centos/
 *
 * This introduced the need to know on which OS we are currently running on, so we can alter the command to execute accordingly.
 *
 */
function getOsType(callback) {
    childProcess.exec('python -mplatform', function(error, stdout, stderr) {
        if (error || stderr) {
            callback(undefined);
        }

        if (stdout.toLowerCase().indexOf('ubuntu') > -1 ) {
            callback('ubuntu');
        }

        if (stdout.toLowerCase().indexOf('centos') > -1 ) {
            callback('centos');
        }
    });
}

/**
 * This methos wrapps the childProcess.spawn functionality, listen for stdout/stderr.
 * It has support for virtual env.
 * Append them to the execution in mongo if options.shouldOutput is true.
 *
 * options = {
        executionId: the execution ID,
        env: the virtual env,
        cmd: the command to execute,
        shouldOutput: true | false
    };

 * @param executionId
 * @param env
 * @param cmd
 * @returns {*}
 */
function spawn(options/*, args, callback*/) {
    var args, callback, stderr, stdout, cmd;

    if (typeof arguments[1] === 'function') {
        args = {};
        callback = arguments[1];
    } else {
        args = arguments[1];
        callback = arguments[2];
    }

    // print the command to log (not mongo) for debugging
    cmd = 'source ' + path.resolve(options.env) + '/bin/activate; ' + options.cmd;
    log('command is: ' + cmd, true);
    var exec = childProcess.spawn('bash', ['-c', cmd], args || {});

    exec.stdout.on('data', function (data) {
        if (!stdout) {
            stdout = '';
        }
        stdout += data;
        if (options.shouldOutput) {
            services.logs.appendOutput(data, options.executionId);
        }
    });

    exec.stderr.on('data', function (data) {
        if (!stderr) {
            stderr = '';
        }
        stderr += data;
        if (options.shouldOutput) {
            services.logs.appendOutput(data, options.executionId);
        }
    });

    exec.on('close', function (/*code*/) {
        callback(stderr, stdout);
        exec.stdin.end();
    });

    return exec;
}

//-----------  Private tasks  ----------------------
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
    var that = this;

    getOsType(function(type) {
        executionDetails.osType = type;
        executionModel.setExecutionDetails(executionDetails);

        log('Execution details: ...\n' + JSON.stringify(executionDetails, {}, 4), true);

        that.updateExecutionModel({
            executionDetails: executionDetails
        }, executionModel, callback);

    });
};

SoloSoftlayerWidgetExecutor.prototype.setupDirectory = function (executionModel, callback) {
    log('copying config files to temp folder', true, true, executionModel.getExecutionId());
    var tmpDirName = path.resolve(__dirname, '..', 'cp_' + executionModel.getExecutionId());
    var that = this;
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
        log('configuration update. now it is \n' + JSON.stringify(executionModel.getCommands(), {}, 4), true, true, executionModel.getExecutionId());

        that.updateExecutionModel({
            downloadsPath: executionModel.getDownloadsPath(),
            commands: executionModel.getCommands()
        }, executionModel, callback);
    });
};

SoloSoftlayerWidgetExecutor.prototype.setupEnvironmentVariables = function (executionModel, callback) {
    var executionDetails = executionModel.getExecutionDetails();
    process.env.SL_USERNAME = executionDetails.softlayer.params.username;
    log('Setting up environment variables....', false, true, executionModel.getExecutionId());
    var options = {
        executionId: executionModel.getExecutionId(),
        env: env,
        cmd: 'echo $SL_USERNAME',
        shouldOutput: false
    };
    spawn(options, {env: process.env}, function (err, stdout) {
        if (err) {
            logger.error('could not set environment variable: SL_USERNAME');
            callback(err, executionModel);
            return;
        }

        log('this is the USERNAME: ' + stdout, true);
        process.env.SL_API_KEY = executionDetails.softlayer.params.apiKey;
        var options = {
            executionId: executionModel.getExecutionId(),
            env: env,
            cmd: 'echo $SL_API_KEY',
            shouldOutput: false
        };
        spawn(options, {env: process.env}, function (err, stdout) {
            if (err) {
                logger.error('could not set environment variable: SL_API_KEY');
                callback(err, executionModel);
                return;
            }
            log('this is the API_KEY: ' + stdout, true);
            callback(null, executionModel);
        });
    });
};

SoloSoftlayerWidgetExecutor.prototype.setupSoftlayerSsh = function (executionModel, callback) {
    log('running setup for softlayer ssh...', true, true, executionModel.getExecutionId());
    var executionId = executionModel.getExecutionId();
    log('your random key: ' + executionId, true);

    // inner waterfall tasks:
    function createKeyPairs(innerCallback) {
        log('Trying to create keypairs ...', true, true, executionModel.getExecutionId());
        var options = {
            executionId: executionModel.getExecutionId(),
            env: env,
            cmd: 'ssh-keygen -t rsa -N "" -f ' + executionId,
            shouldOutput: false
        };
        spawn(options, function (err, output) {
            if (err) {
                logger.error('[setupSoftlayerSsh] failed creating ssh keys: ' + err);
                innerCallback(new Error('failed creating ssh keys'));
                return;
            }

            log('Keypairs created.', true, true, executionModel.getExecutionId());
            log('[setupSoftlayerSsh] ' + output, true);
            innerCallback();
        });
    }

    function addSshKey(innerCallback) {
        log('Trying to add SSH key to Softlayer...', true, true, executionModel.getExecutionId());
        var options = {
            executionId: executionModel.getExecutionId(),
            env: env,
            cmd: 'sl sshkey add -f ' + process.cwd() + '/' + executionId + '.pub' + ' ' + executionId,
            shouldOutput: false
        };
        spawn(options, function (err, output) {
            if (err) {
                log('[setupSoftlayerSsh] failed adding ssh key to softlayer:\n' + err, true, true, executionModel.getExecutionId());
                innerCallback(new Error('failed adding ssh key to softlayer'));
                return;
            }

            log('SSH key added.', true, true, executionModel.getExecutionId());
            log(output, true);
            innerCallback();
        });
    }

    function updateExecutionModel(innerCallback) {
        log('Verifying...', true, true, executionModel.getExecutionId());
        var options = {
            executionId: executionModel.getExecutionId(),
            env: env,
            cmd: 'sl sshkey list',
            shouldOutput: false
        };
        spawn(options, function (err, output) {
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

            log('[setupSoftlayerSsh] got sshkey list output\n' + output, true);

            var line = _.find(output.split('\n'), function (line) {
                return line.indexOf(executionId) >= 0;
            });

            if (!line) {
                logger.error('[setupSoftlayerSsh] expected to find a line with ' +executionId + ' but could not find one. all I got was, ' + output);
                innerCallback(new Error('could not find line with id' + executionId + '. unable to get key id'));
                return;
            }

            log('[setupSoftlayerSsh] line ' + line, true);
            var keyId = line.split(' ', 1);

            if (keyId.length === 0) {
                logger.info('[setupSoftlayerSsh] keyId is an empty array - length is: ' + keyId);
                innerCallback(new Error('could not find the keyId on keyId[0]'));
                return;
            }

            log('[setupSoftlayerSsh] got the keyId: ' + keyId, true);
            var idAsNumber = Number(keyId);
            log('[setupSoftlayerSsh] got the idAsNumber: ' + idAsNumber, true);

            executionModel.setSshKey(idAsNumber);

            innerCallback();
        });
    }

    function innerFinally(err) {
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
    log('editing blu_sljson ...', true, true, executionModel.getExecutionId());

    var executionId = executionModel.getExecutionId();
    var executionDetails = executionModel.getExecutionDetails();
    var inputsFile = path.join(executionModel.getDownloadsPath(), 'blu_sl.json');
    log('inputsFile path is : ' + inputsFile, true, true, executionModel.getExecutionId());

    var softlayerInputs = require(inputsFile);
    log('[editInputsFile] softlayerInputs: ' + softlayerInputs, true);

    softlayerInputs.username = executionDetails.softlayer.params.username;
    softlayerInputs.api_key = executionDetails.softlayer.params.apiKey;

    var db2express = executionModel.executionDetails.recipeProperties.filter(function (item) {
        if (item.key === 'db2expressRandomValue') {
            return item;
        }
    });

    if (db2express.length > 0) {
        softlayerInputs.db2expressRandomValue = db2express[0].value;
    }

    softlayerInputs.ssh_keys = executionModel.getSshKey();
    log('[editInputsFile] ssh_keys ' + executionModel.getSshKey(), true);
    softlayerInputs.ssh_key_filename = process.cwd() + '/' + executionId;

    log('[editInputsFile] softlayerInputs after setting inputs: ' + softlayerInputs, true);
    log('writing to input file ..', true, true, executionModel.getExecutionId());

    fse.writeJSONFile(inputsFile, softlayerInputs, function (err) {
        if (err) {
            logger.error(err);
            callback(err, executionModel);
            return;
        }

        log('softlayerInputs file successfully updated', true, true, executionModel.getExecutionId());
        callback(null, executionModel);
    });
};

SoloSoftlayerWidgetExecutor.prototype.runInitCommand = function (executionModel, callback) {
    var initCommand = executionModel.getCommands().initCommand;

    log('initializing..  ' + initCommand, true, true, executionModel.getExecutionId());
    var options = {
        executionId: executionModel.getExecutionId(),
        env: env,
        cmd: 'echo $SL_USERNAME',
        shouldOutput: false
    };
    spawn(options, {env: process.env}, function (err, stdout) {
        if (err) {
            logger.error('[runInitCommand] could not set environment variable: SL_USERNAME');
            callback(err, executionModel);
            return;
        }
        log('[runInitCommand] this is the USERNAME: ' + stdout, true);
        //listenOutput(executionModel, spawn(executionModel.getExecutionId(), env, initCommand, noOutputCallback(executionModel, callback)));
        options = {
            executionId: executionModel.getExecutionId(),
            env: env,
            cmd: initCommand,
            shouldOutput: true
        };
        spawn(options, noOutputCallback(executionModel, callback));
    });
};

SoloSoftlayerWidgetExecutor.prototype.runInstallWorkflowCommand = function (executionModel, callback) {
    var installWfCommand = executionModel.getCommands().installWfCommand;
    var that = this;

    log('installing workflow: ' + installWfCommand, true, true, executionModel.getExecutionId());

    var options = {
        executionId: executionModel.getExecutionId(),
        env: env,
        cmd: installWfCommand,
        shouldOutput: true
    };
    spawn(options, function (err, output) {
        log('[runInstallWorkflowCommand] cfy install ef command output: ' + output, true);

        if (err) {
            logger.error('[runInstallWorkflowCommand] failed running install workflow command');
            callback(new Error('failed running install workflow command'), executionModel);
            return;
        }

        that.sendEmailAfterInstall(executionModel);
        callback(null, executionModel);
    });

};

//-----------  Private tasks end  ----------------------

//-----------  Overrides  ----------------------

SoloSoftlayerWidgetExecutor.prototype.executionType = 'Solo Softlayer';

SoloSoftlayerWidgetExecutor.prototype.getSendMailTemplateExtraContent = function (executionModel) {
    var retVal = [];

    var db2express = executionModel.executionDetails.recipeProperties.filter(function (item) {
        if (item.key === 'db2expressRandomValue') {
            return item;
        }
    });

    if (db2express.length > 0) {
        retVal.push(
            {
                'name': 'db2expressRandomValue',
                'content': db2express[0].value
            }
        );
    }

    return retVal;
};

SoloSoftlayerWidgetExecutor.prototype.getExecutionTasks = function () {
    return [
        this.soloSoftlayerInit.bind(this),
        this.getWidget.bind(this),
        this.setupDirectory.bind(this),
        this.setupEnvironmentVariables.bind(this),
        this.setupSoftlayerSsh.bind(this),
        this.editInputsFile.bind(this),
        this.runInitCommand.bind(this),
        this.runInstallWorkflowCommand.bind(this)
    ];
};

//-----------  Overrides END ----------------------


module.exports = SoloSoftlayerWidgetExecutor;
