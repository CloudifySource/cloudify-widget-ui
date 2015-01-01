/**
 * Created by liron on 1/1/15.
 */
'use strict';

var logger = require('log4js').getLogger('LocalSoloExecutor');
var _ = require('lodash');
var uuid = require('node-uuid');
var path = require('path');
var fse = require('fs-extra');
var util = require('util');
var exec = require('child_process').exec, child;



/**
 *
 * @param {string} command
 * @param {function} callback e.g. function(error, output)
 */
var runCommand = function (command, callback) {

    logger.debug('running command [', command ,']');
    if ( !command ){
        callback(new Error('command is blank'));
    }
    child = exec(command,
        function (error, stdout, stderr) {
            var output = {
                stderr : stderr,
                stdout : stdout,
                error : error
            };

            logger.debug('stdout: ', stdout);
            if (error !== null) {
                logger.error('exec error: ', error, stderr);
                callback( new Error('command [' + command + '] failed'), output );
            } else {
                callback(null, output);
            }
        });
};


/**
 * @class SoloExecutor
 * @constructor
 */

module.exports = function LocalSoloExecutor(){
    /**
     * @type SoloExecutorConfiguration
     */
    var conf;

    var logger = require('log4js').getLogger('LocalWorkFlowWidgetManager.SoloExecutor');


    this.setConfiguration = function( _conf ){
        conf = _conf;
    };

    this.getConfiguration = function(){
        return conf;
    };

    this.setupDirectory = function (callback) {

        callback = callback || _.noop;

        logger.debug('copying config files to temp folder');
        conf.tmpDirName = 'cp_' + uuid.v1();

        conf.tmpDir = path.resolve(__dirname, '..', conf.tmpDirName );

        fse.copy( conf.configPrototype , conf.tmpDir, function (err) {
            if (!!err) {
                logger.error('failed at copying config files to temp folder', err);
                callback(err);
                return;
            }
        });

        // fill in paths to be reused
        conf.initCommand = util.format('cfy local init -p %s/blueprint.yaml --install-plugins -i %s/softlayer_inputs.json', conf.tmpDir, conf.tmpDir);
        conf.installWfCommand = 'cfy local execute -w install';

        logger.debug('configuration update. now it is \n', JSON.stringify(conf,{},4));

        callback();
    };

    this.editInputsFile = function(callback){
        var inputsFile= path.join(conf.tmpDir, 'softlayer_inputs.json' );
        var softlayerInputs = require( inputsFile );
        softlayerInputs.username = conf.softlayerDetails.username;
        softlayerInputs.apiKey = conf.softlayerDetails.apiKey;
        fse.writeJSONFile( inputsFile, softlayerInputs, callback);

    };


    this.init = function (callback) {
        logger.debug('initializing.. ');
        runCommand(conf.initCommand, callback);
    };

    // install workflow
    this.installWorkflow = function( callback ){
        logger.debug('installing workflow');
        runCommand(conf.installWfCommand, callback );
    };

    this.clean = function( callback ){
        logger.debug('cleaning');
        runCommand(util.format('rm -r %s', conf.tmpDir) , callback );
    };

};
