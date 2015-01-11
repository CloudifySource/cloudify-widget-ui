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
var dbManager = require('./DbManager');
var GsReadline = require('../services/GsReadline');




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
        var setid = uuid.v1();

        conf.tmpDirName = 'cp_' + setid;

        conf.tmpDir = path.resolve(__dirname, '..', conf.tmpDirName );

        fse.copy( conf.configPrototype , conf.tmpDir, function (err) {
            if (!!err) {
                logger.error('failed at copying config files to temp folder', err);
                callback(err);
                return;
            }
            callback();

        });

        // fill in paths to be reused
        conf.initCommand = util.format('cfy local init -p %s/blu_sl_blueprint.yaml --install-plugins -i %s/blu_sl.json', conf.tmpDir, conf.tmpDir);
        conf.installWfCommand = 'cfy local execute -w install';

        logger.debug('configuration update. now it is \n', JSON.stringify(conf,{},4));

    };

        this.setupSoftlayerCli = function(callback){

            process.env.SL_USERNAME= conf.softlayerDetails.username;
            exec('echo $SL_USERNAME', {env: process.env},  function( err, stdout){
                if(!!err){
                    logger.error('could not set environment variable: SL_USERNAME' );
                }
                logger.debug('this is the USERNAME: ', stdout);
            });


            process.env.SL_API_KEY = conf.softlayerDetails.apiKey ;
            exec('echo $SL_API_KEY', {env: process.env},  function( err, stdout){
                if(!!err){
                    logger.error('could not set environment variable: SL_API_KEY' );
                }
                    logger.debug('this is the API_KEY: ', stdout);
            });

            exec('pip install softlayer', function(err, stdout){
                if(!!err){
                    logger.error('error while installing softlayer CLI : ' + err);
                    callback(new Error ('failed to install softlayer CLI'));
                    return;
                };

                logger.debug('stdout: ' + stdout);
                callback();

                });

    };

    this.setupSoftlayerSsh = function(callback){

       logger.debug('running setup for softlayer ssh');

        var randomKey = uuid.v1();

        logger.debug('your random key: ' + randomKey);

        logger.debug('creating keypairs ...');
        exec('ssh-keygen -t rsa -N "" -f ' + randomKey , function(err, output){
            if(!!err){

                logger.error('failed creating ssh keys: ' + err);
                callback(new Error ('failed creating ssh keys'));
                return;

            }

            logger.debug('success! ' + output);

            exec('sl sshkey add -f ' + process.cwd() + '/' + randomKey + '.pub'+ ' ' + randomKey , function(err, output){

                if(!!err){
                    logger.error('failed adding ssh key to softlayer: ' + err);
                    callback(new Error ('failed adding ssh key to softlayer'));
                    return;
                }
                logger.debug('success! ' + output);

                exec('sl sshkey list', function (err, output) {
                    if (!!err) {
                        logger.error('failed running sshkey list on softlayer cli', err);
                        callback(err);
                        return;

                    }

                    if (!output) {
                        logger.error('expected output from sl sshkey list command but got nothing');
                        callback(new Error('missing output from sshkey list command'));
                        return;
                    }


                    logger.trace('got sshkey list output', output);

                    var line = _.find(output.split('\n'), function (line) {
                        return line.indexOf(randomKey) >= 0
                    });

                    if (!line) {
                        logger.error('expected to find a line with ', + randomKey + ' but could not find one. all I got was, ', output);
                        callback(new Error('could not find line with id' + randomKey + '. unable to get key id'));
                        return;
                    };

                    logger.debug('line ' + line);
                    var keyId = line.split(' ', 1);

                    if (keyId.length == 0) {
                        logger.info('keyId is an empty array - length is: ' + keyId);
                        callback(new Error('could not find the keyId on keyId[0]'));
                        return;
                    };


                    logger.info('got the keyId: ' + keyId );
                    var idAsNumber = Number(keyId);
                    logger.info('got the idAsNumber: ' + idAsNumber );
                    callback(idAsNumber);



                });

            });
        });

    };

    this.editInputsFile = function(callback){
        logger.debug('editing blu_sljson .. ');

        var inputsFile= path.join(conf.tmpDir, 'blu_sl.json' );

        logger.debug('inputsFile: ' , inputsFile);
        var softlayerInputs = require( inputsFile );

        logger.debug('softlayerInputs: ' , softlayerInputs);
        softlayerInputs.username = conf.softlayerDetails.username;
        softlayerInputs.api_key = conf.softlayerDetails.apiKey;

        //todo:
        softlayerInputs.ssh_keys = callback;
        logger.debug('ssh_keys ' , callback);
        softlayerInputs.ssh_key_filename =

        logger.debug('softlayerInputs after setting inputs: ' , softlayerInputs);

        logger.debug('writing to input file .. ' , 'blu_sl '+softlayerInputs);
        fse.writeJSONFile( inputsFile, softlayerInputs, callback);

    };


    this.init = function (callback) {
        logger.debug('initializing.. ');
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









