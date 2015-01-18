'use strict';

describe('Controller: AdminPoolViewCtrl', function () {

    // load the controller's module
    beforeEach(module('cloudifyWidgetUiApp'));

    var AdminPoolViewCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        AdminPoolViewCtrl = $controller('AdminPoolViewCtrl', {
            $scope: scope
        });
    }));

    it('should attach a list of awesomeThings to the scope', function () {
        expect(!!scope.getPoolStatus).toBe(true);
    });
});
