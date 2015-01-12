'use strict';

describe('Controller: WidgetsDefault', function () {

    // load the controller's module
    beforeEach(module('cloudifyWidgetUiApp'));

    var STOPPED = 'STOPPED';
    var RUNNING = 'RUNNING';

    var WidgetsDefaultCtrl,
        scope;

    var widgetSuccess = true;
    // Initialize the controller and a mock scope
    var setup = inject(function ($controller, $rootScope, $httpBackend , WidgetsService ) {
        scope = $rootScope.$new();
        spyOn(WidgetsService,'getPublicWidget').and.returnValue({'then' : function( success, error  ){
            if ( widgetSuccess ){
                success({'data' : {}});
            }else{
                error('unable to get widget');
            }

        }});
        //$httpBackend.expectGET('/backend/widgets/login/types').respond(200);
        //$httpBackend.expectGET('/backend/widgets/1').respond(200);
        WidgetsDefaultCtrl = $controller('WidgetsDefaultCtrl', {
            $scope: scope,
            LoginTypesService: {
            },
            $routeParams: {
                widgetId :1
            }
        });
    });

    describe('init load', function(){

        it('should do something', function () {
            setup();
            expect(!!scope.showPlay).toBe(true);
            //expect(scope.awesomeThings.length).toBe(3);
        });
    });

    describe('show play', function(){
        it('should change widgetState on scope', function(){
            expect(scope.showPlay()).toBe(false);
            scope.widgetStatcee
            expect(scope.widgateState).toBe('guy');
        });
    });


});
