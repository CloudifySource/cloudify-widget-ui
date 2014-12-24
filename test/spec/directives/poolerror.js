'use strict';

describe('Directive: poolError', function () {

    // load the directive's module
    beforeEach(module('cloudifyWidgetUiApp'));

    var element,
        isolateScope,
        scope;

    beforeEach(inject(function ($rootScope) {
        scope = $rootScope.$new();
    }));

    var setup = inject(function ($compile) {
        element = angular.element('<div pool-error="data"></div>');
        element = $compile(element)(scope);
        scope.$digest();
        isolateScope = element.children().scope();
    });

    var flushAll = inject(function ($timeout) {
        try {
            $timeout.flush();
        }catch(e){}
        try {
            scope.$digest();
        }catch(e){}
    });

    it('put data on scope', inject(function () {
        scope.poolError = {};
        setup();


        isolateScope.dataObj = { 'info' : 'this is stack trace' } ;
        flushAll();

        expect(isolateScope.data).toBe('this is stack trace');

        isolateScope.dataObj = { 'info' : { 'stackTrace' : 'has stackTrace' }  };
        flushAll();
        expect(isolateScope.data).toBe('has stackTrace');


        // item.className + '#' + item.methodName + ' [' + item.fileName + '] ' + item.lineNumber;
        isolateScope.dataObj = { 'info' : { 'stackTrace' : [ { 'className' : 'a', 'methodName' : 'b' , 'fileName' : 'c', 'lineNumber' : '1'}, { 'className' : 'a1', 'methodName' : 'b1' , 'fileName' : 'c1', 'lineNumber' : '2'} ] }  };
        flushAll();
        expect(isolateScope.data).toBe('a#b [c] 1\na1#b1 [c1] 2');



    }));
});
