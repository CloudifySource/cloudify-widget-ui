/**
 * Created by liron on 12/30/14.
 */
'use strict';


var logger = require('log4js').getLogger('LocalWorkFlowWidgetManager');
//var _ = require('lodash');
//var fs = require('fs-extra');
//var path = require('path');
//var async = require('async');
//var services = require('../../backend/services');
//var uuid = require('node-uuid');

describe('Backend: managers', function () {

    var widgetMgmt = require('../../backend/managers/LocalWorkFlowWidgetManager.js');

    var opts = {
        softlayerDetails: {
            username: 'liron',
            apiKey: 'lironkey'
        },

        executionDetails: {
            _id : '54a56ffd5c25df5a38f1ad2'
        }

    };


    widgetMgmt.localSoloInstallationProcess( opts, function( error ){
        logger.error(error);
    });

    it('test dbManager', function () {



    });

});



