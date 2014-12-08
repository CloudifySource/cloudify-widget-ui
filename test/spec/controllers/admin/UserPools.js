'use strict';

describe('Controller: AdminUserPoolsCtrl', function () {

    // load the controller's module
    beforeEach(module('cloudifyWidgetUiApp','unit-test-mocks'));

    var AdminUserPoolsCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        AdminUserPoolsCtrl = $controller('AdminUserPoolsCtrl', {
            $scope: scope,
            $routeParams: {
                'accountId' : 'mock',
                'poolId' : 'mock'
            }
        });
    }));

    it('should put getAccountPools on scope ', function () {
        expect(!!scope.getAccountPools).toBe(true);
    });
});
