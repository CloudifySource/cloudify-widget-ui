'use strict';

describe('Service: UserClient', function () {

    // load the service's module
    beforeEach(module('cloudifyWidgetUiApp'));

    // instantiate service
    var UserClient;
    beforeEach(inject(function (_UserClient_) {
        UserClient = _UserClient_;
    }));

    it('should do something', function () {
        expect(!!UserClient).toBe(true);
    });

});
