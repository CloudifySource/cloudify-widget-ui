'use strict';
angular.module('widget-mock',[]).run(function( $httpBackend ){
    // a mock for a widget
    $httpBackend.whenGET('/backend/user/widgets/mock').respond(200,{});
    $httpBackend.whenGET('/backend/widgets/mock').respond(200,{});
});