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
var exec = require('child_process').exec;
//var async = require('async');
var dbManager = require('./DbManager');
var GsReadline = require('../services/GsReadline');


//

/**
 *
 * @param {string} command
 * @param {function} callback e.g. function(error, output)
 */
var runCommand = function (command, callback) {

    if ( !callback ){
        callback = function(){}; // noop
    }
    logger.debug('running command [', command ,']');
    if ( !command ){
        callback(new Error('command is blank'));
    }
    var child = exec(command,
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
                logger.debug('all is well. calling callback');
                callback(null, output);
            }
        });

    return child;
};

function noOutputCallback( callback ){
    return function( err, output ){
        callback(err);
    };
}

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

        logger.debug('new conf is: '+conf);
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
            } else {
                callback();
            }
        });

        // fill in paths to be reused
        conf.initCommand = util.format('cfy local init -p %s/blu_sl_blueprint.yaml --install-plugins -i %s/blu_sl.json', conf.tmpDir, conf.tmpDir);
        conf.installWfCommand = 'cfy local execute -w install';

        logger.debug('configuration update. now it is \n', JSON.stringify(conf,{},4));

    };


    this.editInputsFile = function(callback){
        logger.debug('editing blu_sljson .. ');
        var inputsFile= path.join(conf.tmpDir, 'blu_sl.json' );

        logger.debug('inputsFile: ' , inputsFile);
        var softlayerInputs = require( inputsFile );

        logger.debug('softlayerInputs: ' , softlayerInputs);
        softlayerInputs.username = conf.softlayerDetails.username;
        softlayerInputs.api_key = conf.softlayerDetails.apiKey;

        logger.debug('softlayerInputs after setting inputs: ' , softlayerInputs);

        logger.debug('writing to input file .. ' , 'blu_sl '+softlayerInputs);
        fse.writeJSONFile( inputsFile, softlayerInputs, callback);

    };


    this.init = function (callback) {
        logger.debug('initializing.. ');
        //runCommand(conf.initCommand, noOutputCallback(callback) );
        this.listenOutput(exec(conf.initCommand, noOutputCallback(callback)));
    };

    this.installWorkflow = function( callback ){
        logger.debug('installing workflow');
        logger.info(arguments);
        this.listenOutput(exec(conf.installWfCommand, noOutputCallback(callback) ));
    };

    this.clean = function( callback ){
        logger.debug('removing the library');
        fse.remove(conf.tmpDir, noOutputCallback(callback));

    };



    this.listenOutput = function( childProcess ){
        dbManager.connect('widgetExecutions', function (db, collection) {
            function handleLines( type ){
                return function( lines ) {
                    lines = _.map(lines, function(line){
                        logger.trace( type + ' :: [' + line + ']');
                        return { 'type' : type, 'line' : line};
                    });
                    collection.update({_id: conf.executionDetails._id}, {$push: {'output': {$each: lines}}}, function () {
                    });
                };
            }

            new GsReadline( childProcess.stdout).on('lines', handleLines('info') );
            new GsReadline( childProcess.stderr).on('lines', handleLines('error') );
        });

    };
};















