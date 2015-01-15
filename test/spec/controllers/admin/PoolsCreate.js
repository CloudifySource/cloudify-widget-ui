'use strict';

describe('Controller: AdminPoolsCreateCtrl', function () {

    // load the controller's module
    beforeEach(module('cloudifyWidgetUiApp'));

    var AdminPoolsCreateCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        AdminPoolsCreateCtrl = $controller('AdminPoolsCreateCtrl', {
            $scope: scope
        });
    }));

    it('should attach a list of awesomeThings to the scope', function () {
        expect(!!scope.addAccountPool).toBe(true);
    });
});
