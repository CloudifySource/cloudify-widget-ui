'use strict';

describe('Controller: AdminUserPoolsCtrl', function () {

    // load the controller's module
    beforeEach(module('cloudifyWidgetUiApp'));

    var AdminUserPoolsCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        AdminUserPoolsCtrl = $controller('AdminUserPoolsCtrl', {
            $scope: scope
        });
    }));

    it('should put getAccountPools on scope ', function () {
        expect(!!scope.getAccountPools).toBe(true);
    });
});
