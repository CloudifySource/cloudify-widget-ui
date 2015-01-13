/**
 * Created by liron on 12/30/14.
 */
'use strict';


var logger = require('log4js').getLogger('LocalWorkFlowWidgetManager');
var fs = require('fs-extra');
var util = require('util');
var DbManager = require('../../backend/managers/DbManager');

var executionDetails;

function beforeTest( callback ){

    DbManager.connect('example', function(db, collection){
        collection.findOne({'_id' : DbManager.id('54a56ffd5c25df5a38f1ad28')}, function( err, document){
         //   logger.info('found something', arguments);
            if ( !!err ){
                throw new Error('no such thing!');
            }

            if ( !document ){
                throw new Error('no such doc!');
            }
            executionDetails = document;

            callback();
        });
    });
}

//describe('Backend: managers', function () {

function runTest(){
    var widgetMgmt = require('../../backend/managers/LocalWorkFlowWidgetManager.js');

    var opts = {
        softlayerDetails: {
            username: '',
            apiKey: ''
        },

        executionDetails: executionDetails

    };

    var finished = false;

    widgetMgmt.localSoloInstallationProcess(opts, function (error) {
        logger.error(error);
        finished = true;
    });
}


beforeTest(runTest);
//runTest();
    //it('should sum', function(){
    //    expect(1+1).toBe(2);
    //});
    //
    //it('should finish execution', function () {
    //    waitsFor(function(){
    //        return finished;
    //    });
    //
    //    runs(function(){
    //        expect(finished).toBe(true);
    //    })
    //
    //
    //});

//});



