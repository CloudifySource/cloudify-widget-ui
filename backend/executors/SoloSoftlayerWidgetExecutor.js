/**
 * Created by sefi on 28/01/15.
 */
'use strict';

var util = require('util');
var path = require('path');
var logger = require('log4js').getLogger('SoloSoftlayerWidgetExecutor');
var managers = require('../managers');
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
    var args, callback, stderr, stdout;

    if(typeof arguments[1] === 'function') {
        args = {};
        callback = arguments[1];
    } else {
        args = arguments[1];
        callback = arguments[2];
    }

    var exec = childProcess.spawn('bash', ['-c', 'source ' + path.resolve(options.env) + '/bin/activate; ' + options.cmd], args || {});

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
    executionModel.setExecutionDetails(executionDetails);

    services.logs.appendOutput('\nExecution details: ...\n' + JSON.stringify(executionModel.getExecutionDetails, {}, 4), executionModel.getExecutionId());

    this.updateExecutionModel({
        executionDetails: executionModel.getExecutionDetails()
    }, executionModel, callback);
};

SoloSoftlayerWidgetExecutor.prototype.setupDirectory = function (executionModel, callback) {
    services.logs.appendOutput('\ncopying config files to temp folder', executionModel.getExecutionId());
    logger.debug('[setupDirectory] copying config files to temp folder');
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
        services.logs.appendOutput('\nconfiguration update. now it is \n' + JSON.stringify(executionModel.getCommands(), {}, 4), executionModel.getExecutionId());
        logger.debug('[setupDirectory] configuration update. now it is \n', JSON.stringify(executionModel.getCommands(), {}, 4));

        that.updateExecutionModel({
            downloadsPath: executionModel.getDownloadsPath(),
            commands: executionModel.getCommands()
        }, executionModel, callback);
    });
};

SoloSoftlayerWidgetExecutor.prototype.setupEnvironmentVariables = function (executionModel, callback) {
    var executionDetails = executionModel.getExecutionDetails();
    process.env.SL_USERNAME = executionDetails.softlayer.params.username;
    services.logs.appendOutput('\nSetting up environment variables....', executionModel.getExecutionId());
    var options = {
        executionId: executionModel.getExecutionId(),
        env: env,
        cmd: 'echo $SL_USERNAME',
        shouldOutput: false
    };
    spawn(options, {env: process.env}, function (err, stdout) {
        if (err) {
            logger.error('[setupEnvironmentVariables] could not set environment variable: SL_USERNAME');
            callback(err, executionModel);
            return;
        }
        logger.debug('[setupEnvironmentVariables] this is the USERNAME: ', stdout);

        process.env.SL_API_KEY = executionDetails.softlayer.params.apiKey;
        options = {
            executionId: executionModel.getExecutionId(),
            env: env,
            cmd: 'echo $SL_API_KEY',
            shouldOutput: false
        };
        spawn(options, {env: process.env}, function (err, stdout) {
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
    services.logs.appendOutput('\nSetting up Softlayer CLI...', executionModel.getExecutionId());
    var options = {
        executionId: executionModel.getExecutionId(),
        env: env,
        cmd: 'sudo pip install softlayer',
        shouldOutput: true
    };

    spawn(options, function (err, stdout) {
        if (err) {
            logger.error('[setupSoftlayerCli] error while installing softlayer CLI : ' + err);
            callback(new Error('failed to install softlayer CLI:\n' + stdout), executionModel);
            return;
        }

        logger.debug('[setupSoftlayerCli] stdout: ' + stdout);
        //services.logs.appendOutput(stdout, executionModel.getExecutionId());
        callback(null, executionModel);
    });
};

SoloSoftlayerWidgetExecutor.prototype.setupSoftlayerSsh = function (executionModel, callback) {
    services.logs.appendOutput('\nrunning setup for softlayer ssh...', executionModel.getExecutionId());
    logger.debug('[setupSoftlayerSsh] running setup for softlayer ssh');
    var executionId = executionModel.getExecutionId();
    logger.debug('[setupSoftlayerSsh] your random key: ' + executionId);

    // inner waterfall tasks:
    function createKeyPairs (innerCallback) {
        logger.debug('[setupSoftlayerSsh] Trying to create keypairs ...');
        services.logs.appendOutput('\nTrying to create keypairs ...', executionModel.getExecutionId());
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

            services.logs.appendOutput('\nKeypairs created.', executionModel.getExecutionId());
            logger.debug('[setupSoftlayerSsh] ' + output);
            innerCallback();
        });
    }

    function addSshKey (innerCallback) {
        logger.debug('[setupSoftlayerSsh] Trying to add SSH key to Softlayer...');
        services.logs.appendOutput('\nTrying to add SSH key to Softlayer...', executionModel.getExecutionId());
        var options = {
            executionId: executionModel.getExecutionId(),
            env: env,
            cmd: 'sl sshkey add -f ' + process.cwd() + '/' + executionId + '.pub' + ' ' + executionId,
            shouldOutput: false
        };
        spawn(options, function (err, output) {
            if (err) {
                logger.error('[setupSoftlayerSsh] failed adding ssh key to softlayer: ' + err + output);
                innerCallback(new Error('failed adding ssh key to softlayer'));
                return;
            }

            services.logs.appendOutput('\nSSH key added.', executionModel.getExecutionId());
            logger.debug('[setupSoftlayerSsh] success! ' + output);
            innerCallback();
        });
    }

    function updateExecutionModel (innerCallback) {
        logger.debug('[setupSoftlayerSsh] Verifying...');
        services.logs.appendOutput('\nVerifying...', executionModel.getExecutionId());
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
    services.logs.appendOutput('\nediting blu_sljson ...', executionModel.getExecutionId());

    var executionId = executionModel.getExecutionId();
    var executionDetails = executionModel.getExecutionDetails();
    var inputsFile = path.join(executionModel.getDownloadsPath(), 'blu_sl.json');
    logger.debug('[editInputsFile] inputsFile path is : ', inputsFile);
    services.logs.appendOutput('\ninputsFile path is : ' + inputsFile, executionModel.getExecutionId());

    var softlayerInputs = require(inputsFile);
    logger.debug('[editInputsFile] softlayerInputs: ', softlayerInputs);

    softlayerInputs.username = executionDetails.softlayer.params.username;
    softlayerInputs.api_key = executionDetails.softlayer.params.apiKey;
    softlayerInputs.db2expressRandomValue = executionDetails.recipeProperties.filter(function(item) {
        if (item.key === 'db2expressRandomValue') {
            return item;
        }
    })[0].value;

    softlayerInputs.ssh_keys = executionModel.getSshKey();
    logger.debug('[editInputsFile] ssh_keys ', executionModel.getSshKey());
    softlayerInputs.ssh_key_filename = process.cwd() + '/' + executionId;

    logger.debug('[editInputsFile] softlayerInputs after setting inputs: ', softlayerInputs);
    logger.debug('[editInputsFile] writing to input file .. ', 'blu_sl ' + softlayerInputs);
    services.logs.appendOutput('\nwriting to input file ..', executionModel.getExecutionId());

    fse.writeJSONFile(inputsFile, softlayerInputs, function (err) {
        if (err) {
            logger.error(err);
            callback(err, executionModel);
            return;
        }

        logger.info('[editInputsFile] softlayerInputs file successfully updated');
        services.logs.appendOutput('\nsoftlayerInputs file successfully updated', executionModel.getExecutionId());
        callback(null, executionModel);
    });
};

SoloSoftlayerWidgetExecutor.prototype.runInitCommand = function (executionModel, callback) {
    var initCommand = executionModel.getCommands().initCommand;

    logger.debug('[runInitCommand] initializing..  ' + initCommand);
    services.logs.appendOutput('\ninitializing..  ' + initCommand, executionModel.getExecutionId());
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
        logger.debug('[runInitCommand] this is the USERNAME: ', stdout);
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

    //logger.debug('[runInstallWorkflowCommand] installing workflow: ' + installWfCommand);
    services.logs.appendOutput('\ninstalling workflow: ' + installWfCommand, executionModel.getExecutionId());

    var options = {
        executionId: executionModel.getExecutionId(),
        env: env,
        cmd: installWfCommand,
        shouldOutput: true
    };
    spawn(options, function (err, output) {
        logger.trace('[runInstallWorkflowCommand] cfy install ef command output: ' + output);

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

    var db2express = executionModel.executionDetails.recipeProperties.filter(function(item) {
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
        this.setupSoftlayerCli.bind(this),
        this.setupSoftlayerSsh.bind(this),
        this.editInputsFile.bind(this),
        this.runInitCommand.bind(this),
        this.runInstallWorkflowCommand.bind(this)
    ];
};

//-----------  Overrides END ----------------------


module.exports = SoloSoftlayerWidgetExecutor;
