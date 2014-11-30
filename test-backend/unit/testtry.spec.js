/**
 * Created by liron on 11/26/14.
 */

'use strict';

process.env.ME_CONF = require('path').resolve(__dirname, '../conf/test-conf.json');

describe('Backend: walkFolder', function () {

    it('has a browseBlueprint', function () {
        var controller = require('../../backend/controllers/AdminUsersController');
        expect(2+2).toBe(4);
    });


});
