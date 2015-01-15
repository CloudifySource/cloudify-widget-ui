'use strict';

describe('Controller: WidgetViewCtrl', function () {

    // load the controller's module
    beforeEach(module('cloudifyWidgetUiApp', 'unit-test-mocks'));

    var WidgetViewCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        WidgetViewCtrl = $controller('WidgetViewCtrl', {
            $scope: scope,
            $routeParams: {
                'widgetId' : 'mock'
            }
        });
    }));

    it('should attach getInclude to scope', function () {
        expect(!!scope.getInclude).toBe(true);
    });
});
