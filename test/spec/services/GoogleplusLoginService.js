'use strict';

describe('Service: GoogleplusLoginService', function () {

    // load the service's module
    beforeEach(module('cloudifyWidgetUiApp'));

    // instantiate service
    var mGoogleplusLoginService;
    beforeEach(inject(function (GoogleplusLoginService) {
        mGoogleplusLoginService = GoogleplusLoginService;
    }));

    it('should do something', function () {
        expect(!!mGoogleplusLoginService).toBe(true);
    });

});
