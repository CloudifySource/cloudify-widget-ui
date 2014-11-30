'use strict';
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