'use strict';
/**
 * Created by liron on 11/30/14.
 */
var logger = require('log4js').getLogger('testDbManager.spec');
describe('Backend: managers', function () {
    var dbManager = require('../../../backend/managers/DbManager');
    it('test dbManager', function () {
        logger.info('01: test throw exception ');
        var ObjectID = require('mongodb').ObjectID;
        expect(function () {
            dbManager.toObjectId(ObjectID);
        }).toThrow(new Error('unable to parse ObjectID from id [' + ObjectID + ']'));
        logger.info('02: test return id from an object');
        var objectId = new ObjectID();
        var retval = dbManager.toObjectId(objectId);
        expect(retval).toBe(objectId);
        logger.info('03: test id() ');
        var retval2 = dbManager.id(objectId);
        expect(retval2).toBe(objectId);
    });
});
