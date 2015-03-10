'use strict';
/**
 * Created by liron on 11/27/14.
 */
process.env.WIDGET_UI_ME_CONF_JSON = require('path').resolve(__dirname, '../conf/test-conf.json');
var logger = require('log4js').getLogger('CloudifyCliService.spec');
var fs = require('fs');
describe('Backend: CloudifyCliService Tests', function () {
    var cloudifyCliService = require('../../../backend/services/CloudifyCliService');
    it('test executeCommand', function () {
        var testOptions = [
            'pwd',
            'll'
        ];
        var name = 'not a function';
        logger.info('0.1 test exception when file not exist');
        logger.info('0.2 test exception when 2nd param not a callback');
        spyOn(fs, 'existsSync').andReturn(true);
        expect(function () {
            cloudifyCliService.executeCommand(testOptions, name);
        }).toThrow(new Error('onExit callback must be a function'));
    });    /*    it('test readConfigurationFromFile', function () {
     var conf = require('../../Conf');

     var testDir = conf.cloudId;
     cloudifyCliService.readConfigurationFromFile(testDir);

     });*/
});
