var expect = require('expect.js');
var proxyquire =  require('proxyquire').noCallThru();
var UserSettingsController = proxyquire('../../../backend/controllers/UserSettingsController',{
    '../models' : {},
    '../services': {}
});

describe('UserSettingsController', function(){
    describe('read', function(){
        it('should read user settings', function(){

        });
    });
});
