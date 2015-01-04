'use strict';

describe('Directive: section', function () {

    // load the directive's module
    beforeEach(module('cloudifyWidgetUiApp'));

    var element,
        scope;

    beforeEach(inject(function ($rootScope) {
        scope = $rootScope.$new();
    }));

    it('should add class active-section', inject(function ($compile, $route, $httpBackend ) {
        $httpBackend.whenGET('views/login.html').respond(200,'login page');
        $route.current = { $$route : { section : 'foo' } };
        element = angular.element('<div section="foo"></div>');
        element = $compile(element)(scope);
        scope.$digest();
        expect(element.hasClass('active-section')).toBe(true);

    }));

    it('should remove hidden element visible', inject(function ($compile, $route, $httpBackend ) {
        $httpBackend.whenGET('views/login.html').respond(200,'login page');
        $route.current = { $$route : { section : 'bar' } };
        element = angular.element('<div section="foo" class="active-section"></div>');
        element = $compile(element)(scope);
        scope.$digest();
        expect(element.hasClass('active-section')).toBe(false);
    }));
});
