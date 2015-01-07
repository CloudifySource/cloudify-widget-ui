'use strict';

describe('Service: UserSettingsService', function () {

    // load the service's module
    beforeEach(module('cloudifyWidgetUiApp'));

    // instantiate service
    var mUserSettingsService;
    beforeEach(inject(function (UserSettingsService) {
        mUserSettingsService = UserSettingsService;
    }));

    it('should do something', function () {
        expect(!!mUserSettingsService).toBe(true);
    });

});
