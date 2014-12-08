'use strict';

describe('Controller: AdminWidgetReadCtrl', function () {

    // load the controller's module
    beforeEach(module('cloudifyWidgetUiApp','unit-test-mocks'));

    var AdminWidgetReadCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope ) {

        scope = $rootScope.$new();
        scope.widgetId = 6;
        AdminWidgetReadCtrl = $controller('AdminWidgetReadCtrl', {
            $scope: scope,
            $routeParams: {
                'widgetId' : 'mock'
            }
        });
    }));

    it('should attach theme to the scope', function () {
        expect(!!scope.theme).toBe(true);
    });
});
