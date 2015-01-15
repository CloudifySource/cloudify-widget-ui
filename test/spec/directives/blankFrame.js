'use strict';

describe('Directive: blankFrame', function () {
    beforeEach(module('cloudifyWidgetUiApp'));

    var element;

    it('should make hidden element visible', inject(function ($rootScope, $compile) {
        element = angular.element('<div blank-frame></div>');
        element = $compile(element)($rootScope);
        expect(element.find('iframe').length).toBe(1);
    }));
});
