'use strict';

describe('Service: UserSettingsService', function () {

    // load the service's module
    beforeEach(module('cloudifyWidgetUiApp'));

    // instantiate service
    var mUserSettingsService;
    beforeEach(inject(function (UserSettingsService) {
        mUserSettingsService = UserSettingsService;
    }));

    it('changePassword', inject(function ( $httpBackend ) {
        $httpBackend.expectPOST('/backend/userSettings/changePassword').respond(200,{});
        mUserSettingsService.changePassword({});
    }));

});
