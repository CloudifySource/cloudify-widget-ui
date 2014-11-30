'use strict';
process.env.WIDGET_UI_ME_CONF_JSON = require('path').resolve(__dirname, '../conf/test-conf.json');
/**
 * Created by liron on 11/30/14.
 */
var logger = require('log4js').getLogger('testDbManager.spec');
describe('Backend: managers', function () {
    var dbManager = require('../../backend/managers/DbManager');
    it('test dbManager', function () {
        var collectionName = null;
        var connection = dbManager.connect(collectionName, function () {
        });
        logger.info('connection = ' + connection);
    });
});