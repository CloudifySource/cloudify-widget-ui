'use strict';

describe('Service: AdminClient', function () {

    // load the service's module
    beforeEach(module('cloudifyWidgetUiApp'));

    // instantiate service
    var AdminClient;
    beforeEach(inject(function (_AdminClient_) {
        AdminClient = _AdminClient_;
    }));

    it('should do something', function () {
        expect(!!AdminClient).toBe(true);
    });

});
