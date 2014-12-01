'use strict';

describe('Controller: AdminWidgetReadCtrl', function () {

    // load the controller's module
    beforeEach(module('cloudifyWidgetUiApp'));

    var AdminWidgetReadCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        AdminWidgetReadCtrl = $controller('AdminWidgetReadCtrl', {
            $scope: scope
        });
    }));

    it('should attach theme to the scope', function () {
        expect(!!scope.theme).toBe(true);
    });
});
