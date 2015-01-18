'use strict';

describe('Directive: downloadPem', function () {

    // load the directive's module
    beforeEach(module('cloudifyWidgetUiApp'));

    var element,
        isolateScope,
        scope;

    beforeEach(inject(function ($rootScope) {
        scope = $rootScope.$new();
    }));

    var setup = inject(function($compile){
        element = angular.element('<div download-pem="sshDetails"></div>');
        element = $compile(element)(scope);
        isolateScope = element.children().scope();
        scope.$digest();

    });

    it('should make hidden element visible', function () {
        setup();
        expect(element.text().indexOf('download pem') >= 0).toBe(true);
    });

    it('change value of shouldShowPem when showPem is called', function(){
        setup();
        expect(isolateScope.shouldShowPem).toBe(false);
        isolateScope.showPem();
        expect(isolateScope.shouldShowPem).toBe(true);
        isolateScope.showPem();
        expect(isolateScope.shouldShowPem).toBe(false);

    });

    it('should detect is has a pem', function(){
        setup();

        expect(isolateScope.hasPem()).toBe(false);
        isolateScope.sshDetails = {};
        expect(isolateScope.hasPem()).toBe(false);
        isolateScope.sshDetails = { privateKey : 'this is private key' };
        expect(isolateScope.hasPem()).toBe(true);
    });

    it('should create an anchor tag and download file', inject(function( ){
        setup();
        isolateScope.sshDetails = { 'privateKey' : 'this is private key' };
        spyOn(document, 'createElement').and.callThrough();
        $('body').append(element);
        isolateScope.downloadPem();
        expect(document.createElement).toHaveBeenCalledWith('a');
    }));


});
