/**
 * Created by sefi on 28/01/15.
 */
'use strict';

var util = require('util');
var path = require('path');
var logger = require('log4js').getLogger('SoloSoftlayerWidgetExecutor');
var managers = require('../managers');
var services = require('../services');
var fs = require('fs');
var fse = require('fs-extra');
var exec = require('child_process').exec;
var _ = require('lodash');
var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');

function SoloSoftlayerWidgetExecutor() {
    AbstractWidgetExecutor.call(this);
}

util.inherits(SoloSoftlayerWidgetExecutor, AbstractWidgetExecutor);

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
    exec('echo $SL_USERNAME', {env: process.env}, function (err, stdout) {
        if (err) {
            logger.error('[setupEnvironmentVariables] could not set environment variable: SL_USERNAME');
            callback(err, executionModel);
            return;
        }
        logger.debug('[setupEnvironmentVariables] this is the USERNAME: ', stdout);

        process.env.SL_API_KEY = executionDetails.softlayer.params.apiKey;
        exec('echo $SL_API_KEY', {env: process.env}, function (err, stdout) {
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
    exec('sudo pip install softlayer', function (err, stdout) {
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

    // TODO: use an inner async waterfall instead of all this execs hell
    var executionId = executionModel.getExecutionId();
    logger.debug('[setupSoftlayerSsh] your random key: ' + executionId);

    logger.debug('[setupSoftlayerSsh] creating keypairs ...');
    exec('ssh-keygen -t rsa -N "" -f ' + executionId, function (err, output) {
        if (err) {
            logger.error('[setupSoftlayerSsh] failed creating ssh keys: ' + err);
            callback(new Error('failed creating ssh keys'), executionModel);
            return;
        }

        logger.debug('[setupSoftlayerSsh] success! ' + output);

        exec('sl sshkey add -f ' + process.cwd() + '/' + executionId + '.pub' + ' ' + executionId, function (err, output) {
            if (err) {
                logger.error('[setupSoftlayerSsh] failed adding ssh key to softlayer: ' + err);
                callback(new Error('failed adding ssh key to softlayer'), executionModel);
                return;
            }
            logger.debug('[setupSoftlayerSsh] success! ' + output);

            exec('sl sshkey list', function (err, output) {
                if (err) {
                    logger.error('[setupSoftlayerSsh] failed running sshkey list on softlayer cli', err);
                    callback(err, executionModel);
                    return;
                }

                if (!output) {
                    logger.error('[setupSoftlayerSsh] expected output from sl sshkey list command but got nothing');
                    callback(new Error('missing output from sshkey list command'), executionModel);
                    return;
                }

                logger.trace('[setupSoftlayerSsh] got sshkey list output', output);

                var line = _.find(output.split('\n'), function (line) {
                    return line.indexOf(executionId) >= 0;
                });

                if (!line) {
                    logger.error('[setupSoftlayerSsh] expected to find a line with ', +executionId + ' but could not find one. all I got was, ', output);
                    callback(new Error('could not find line with id' + executionId + '. unable to get key id'), executionModel);
                    return;
                }

                logger.debug('[setupSoftlayerSsh] line ' + line);
                var keyId = line.split(' ', 1);

                if (keyId.length === 0) {
                    logger.info('[setupSoftlayerSsh] keyId is an empty array - length is: ' + keyId);
                    callback(new Error('could not find the keyId on keyId[0]'), executionModel);
                    return;
                }

                logger.info('[setupSoftlayerSsh] got the keyId: ' + keyId);
                var idAsNumber = Number(keyId);
                logger.info('[setupSoftlayerSsh] got the idAsNumber: ' + idAsNumber);

                executionModel.setSshKey(idAsNumber);

                callback(null, executionModel);
            });
        });
    });
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
    exec('echo $SL_USERNAME', {env: process.env}, function (err, stdout) {
        if (err) {
            logger.error('[runInitCommand] could not set environment variable: SL_USERNAME');
            callback(err, executionModel);
            return;
        }
        logger.debug('[runInitCommand] this is the USERNAME: ', stdout);
        listenOutput(executionModel, exec(initCommand, noOutputCallback(executionModel, callback)));
    });
};

SoloSoftlayerWidgetExecutor.prototype.runInstallWorkflowCommand = function (executionModel, callback) {
    var installWfCommand = executionModel.getCommands().installWfCommand;

    logger.debug('[runInstallWorkflowCommand] installing workflow: ' + installWfCommand);

    // this.listenOutput(exec(conf.installWfCommand, noOutputCallback(callback) ));
    exec(installWfCommand, function (err, output) {
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
        this.soloSoftlayerInit,
        this.getWidget,
        this.saveExecutionModel,
        //this.setupVirtualenv,
        this.setupDirectory,
        this.setupEnvironmentVariables,
        this.setupSoftlayerCli,
        this.setupSoftlayerSsh,
        this.editInputsFile,
        this.runInitCommand,
        this.runInstallWorkflowCommand
    ];
};

//-----------  Overrides END ----------------------


module.exports = SoloSoftlayerWidgetExecutor;
