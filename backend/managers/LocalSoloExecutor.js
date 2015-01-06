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


//

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
                logger.debug('all is well. calling callback');
                callback(null, output);
            }
        });
};

function noOutputCallback( callback ){
    return function( err, output ){
        callback(err);
    }
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
        conf.executionDetails = path.join(conf.tmpDir, 'executionDetails.json' );

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
        conf.initCommand = util.format('cfy local init -p %s/blueprint.yaml --install-plugins -i %s/softlayer_inputs.json', conf.tmpDir, conf.tmpDir);
        conf.installWfCommand = 'cfy local execute -w install';

        logger.debug('configuration update. now it is \n', JSON.stringify(conf,{},4));

    };


    this.editInputsFile = function(callback){
        logger.debug('editing softlayer_inputs.json .. ');
        var inputsFile= path.join(conf.tmpDir, 'softlayer_inputs.json' );

        logger.debug('inputsFile: ' , inputsFile);
        var softlayerInputs = require( inputsFile );

        logger.debug('softlayerInputs: ' , softlayerInputs);
        softlayerInputs.username = conf.softlayerDetails.username;
        softlayerInputs.api_key = conf.softlayerDetails.apiKey;

        logger.debug('softlayerInputs after setting inputs: ' , softlayerInputs);

        logger.debug('writing to input file .. ' , 'softlayerInputs '+softlayerInputs);
        fse.writeJSONFile( inputsFile, softlayerInputs, callback);

    };


    this.getStringIdFromReturnedJson = function(callback){
        var responseFile = conf.executionDetails;
        //var ed = require( responseFile );
        var id = responseFile._id;
        logger.debug('id is: ' , id);
        callback(null, id);
    };

    this.init = function (callback) {
        logger.debug('initializing.. ');
        runCommand(conf.initCommand, noOutputCallback(callback) );
    };

    // install workflow
    this.installWorkflow = function( callback ){
        logger.debug('installing workflow');
        logger.info(arguments);
        runCommand(conf.installWfCommand, noOutputCallback(callback) );
    };

    this.clean = function( callback ){
        logger.debug('cleaning');
        runCommand(util.format('rm -r %s', conf.tmpDir) , noOutputCallback(callback) );
    };


    this.updateDb = function (id){

        var dbManager = require('./DbManager');
        logger.debug('connecting to DB');
        var collection = 'example';
        dbManager.connect(collection, function(){
            logger.debug('connected to ' +  collection);
        });
        logger.debug('connecting to DB ' +  id);
        //dbManager.toObjectId(id);
        //todo - need to modify dbmangaer so I could get the mongoClient for using - update + findOne methods.

        var dbHandler = new DbHandler();
        dbHandler.updateDB();



        }

};

/** constructor */

var DbHandler = function(){


    var MongoClient = require('mongodb').MongoClient;

    var mongoClient = new MongoClient();

    var dbConnection = null;

    var getConnection = function(){

        if (dbConnection !== null) {
            callback(null, dbConnection);
        } else {
            mongoClient.connect(conf.mongodbUrl, { 'auto_reconnect': true }, function (err, db) {
                dbConnection = db;
                callback(err, db);
            }); }
    }

    var updateMongo = function(document, callback){

        mongoClient.update({ _id : executionDetails._id },  { $insert : { 'output' : output } }, callback );

    }

    var findById = function(callback){

        mongoClient.findOne( { _id : executionDetails._id },  function( err, document ){
            if ( !document.output ){
                document.output = [];
            }
            document.output.push(outputLine);

        });

    }



    this.updateDB = function(){

        async.waterfall([
            getConnection,
            findById,
            updateMongo

        ], function(error, result){})


    }

}
