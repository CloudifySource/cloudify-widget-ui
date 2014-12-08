'use strict';

angular.module('pool-mocks',[]).run(function( $httpBackend ){
    // a mock for a widget
    $httpBackend.whenGET('/backend/user/account/pools').respond(200,{});
    $httpBackend.whenGET('/backend/admin/accounts/mock/pools/mock').respond(200,{});
    $httpBackend.whenGET('/backend/admin/accounts/mock/pools').respond(200,{});
});