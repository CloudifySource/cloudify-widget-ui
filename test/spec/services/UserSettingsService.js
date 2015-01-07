'use strict';

describe('Service: UserSettingsService', function () {

    // load the service's module
    beforeEach(module('cloudifyWidgetUiApp'));

    // instantiate service
    var mUserSettingsService;
    beforeEach(inject(function (UserSettingsService) {
        mUserSettingsService = UserSettingsService;
    }));

    it('should change password', inject(function ( $httpBackend ) {
        $httpBackend.expectPOST('/backend/userSettings/changePassword').respond(200,{});
        mUserSettingsService.changePassword({});
    }));

    it('should set poolKey', inject(function($httpBackend){
        $httpBackend.expectPOST('/backend/admin/myUser/setPoolKey').respond(200,{});
        mUserSettingsService.setPoolKey({});
    }));

    it('should test pool key', inject(function($httpBackend){
        $httpBackend.expectPOST('/backend/admin/myUser/testAdminPoolKey').respond(200,{});
        mUserSettingsService.testPoolKey({});
    }));

});
