'use strict';

describe('Controller: UserSettingsCtrl', function () {

    // load the controller's module
    beforeEach(module('cloudifyWidgetUiApp'));

    var UserSettingsCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        UserSettingsCtrl = $controller('UserSettingsCtrl', {
            $scope: scope
        });
    }));

    var setup = inject(function( $httpBackend ){
        $httpBackend.whenGET('/backend/userSettings/read').respond(200,{});
    });

    it('should attach a list of awesomeThings to the scope', function () {
        setup();
        //expect(scope.awesomeThings.length).toBe(3);
    });
});
