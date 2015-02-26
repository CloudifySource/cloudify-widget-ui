'use strict';

var logger = require('log4js').getLogger('CloudifyCliService');

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
//var files = require('./FilesService');
var logs = require('./LogsService');
var conf = require('../Conf');
var _ = require('lodash');


/**
 * @param options is an array of command arguments, or an object like this, with only 'arguments' mandatory:
 *
 *      {
 *          executable: conf.cloudifyExecutable,
 *          arguments: ['connect', nodeModel.machineSshDetails.publicIp, ';', widget.recipeType.installCommand, path.join(downloadPath, widget.recipeRootPath) ],
 *          executionId: '1234231412341234'
 *      }
 */
exports.executeCommand = function (options, callback) {

    var _options = options;
    var output = '';
    if (_.isArray(options)) {
        _options = {arguments: options};
    }

    logger.info('~~~executeCommand [%s] ', options);

    var defaultOptions = {
        executable: conf.cloudifyExecutable
    };
    _options = _.extend(defaultOptions, _options);

    var executable = _options.executable;
    logger.info('resolved executable path is : [', path.resolve(executable), ']');
    // converts commandArgs to list if it is not a list. otherwise keeps it as a list
    // http://stackoverflow.com/questions/4775722/check-if-object-is-array
    var commandArgs = [].concat(_options.arguments);

    if (!executable) {
        throw new Error('exectuable is missing from command');
    }

    if (!fs.existsSync(executable)) {
        throw new Error('executable does not exist ::' + executable);
    }

    if (!commandArgs) {
        throw new Error('commandArgs are missing from command');
    }


    var myCmd;
    try {
        myCmd = spawn(executable, commandArgs);
    } catch (e) {
        logger.error('error while spawning command');
        callback(e);
    }


    function appendToLogFile(data) {
        output += data;
        logs.appendOutput(data, _options.executionId);
    }

    function writeStatusJsonFile(status) {
        output += status;
        logs.writeStatus(JSON.stringify(status, null, 4) + '\n', _options.executionId);
    }

    myCmd.stdout.on('data', appendToLogFile);

    myCmd.stderr.on('data', appendToLogFile);

    myCmd.on('error', function (err) {
        writeStatusJsonFile({'error': err});
    });

    myCmd.on('exit', function (code, signal) {
        logger.info('finished running command. exit code is [%s], exit signal is [%s]', code, signal);
        logs.clearOutputBuffer(_options.executionId);
        if (callback) {
            if (code !== 0) {
                callback(new Error('command failed with exit code [' + code + '] and exit signal [' + signal + ']'), { output: output });
            } else {
                callback(null, { code: code, signal: signal, output: output });
            }
        }
    });

    myCmd.on('close', function (code) {
        writeStatusJsonFile({'code': code});
        callback(null, { code: code, output: output });
    });

    logger.info('running command [%s] [%s]...', executable, commandArgs);

};


/**
 * only used in main!
 *
 * opts = {
 *  'newDir' : 'new tasks directory'
 * }
 * @param opts
 * @returns {null}
 */
exports.readConfigurationFromFile = function (opts) {

    var newDir = opts.newDir;
    logger.debug(' reading execConfiguration from file', opts);
    if (!fs.existsSync(newDir)) {
        logger.debug('[%s] directory does not exist. nothing to do', newDir);
        return null;
    }
    var files = fs.readdirSync(newDir);

    if (files.length === 0 || files.indexOf('stop') >= 0) {
        logger.debug('no files found, aborting');
        return null;
    }

    var workfile = files[0];

    if (!fs.existsSync(workfile)) {
        fs.mkdirSync(workfile);
    }

    var executingDir = opts.executingDir;
    logger.debug(' reading execConfiguration from file', opts);
    if (!fs.existsSync(executingDir)) {
        logger.debug('[%s] directory does not exist. nothing to do', executingDir);
        return null;
    }

    var filePath = path.join(newDir, workfile);
    var executingFilePath = path.join(executingDir, workfile);
    fs.renameSync(filePath, executingFilePath);

    var fileContent = fs.readFileSync(executingFilePath);

    return JSON.parse(fileContent);
};


if (require.main === module) {
    logger.info('running main file CloudifyCliService');
    try {
        var execConfiguration = exports.readConfigurationFromFile(conf.cloudifyCliService);
        if (!!execConfiguration) {
            exports.executeCommand(execConfiguration);
        }
    } catch (e) {
        logger.error('error while running CloudifyCliService as main', e);
    }
}
