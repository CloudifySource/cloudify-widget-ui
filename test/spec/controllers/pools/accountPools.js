'use strict';

describe('Controller: AccountPoolCtrl', function () {

    // load the controller's module
    beforeEach(module('cloudifyWidgetUiApp'));

    var AccountPoolCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        AccountPoolCtrl = $controller('AccountPoolCtrl', {
            $scope: scope
        });
    }));

    it('should attach name to scope', function () {
        expect(!!scope.name).toBe(true);
    });
});
