'use strict';

angular.module('cloudifyWidgetUiApp')
    .provider('Client', function (/*AdminClient, UserClient, $routeParams,*/) {
//        $log.info('factory returns client', $routeParams.role);
//    // Service logic
//    // ...
//
//    var meaningOfLife = 42;
//
        this.$get = function ($log, $routeParams, AdminClient, UserClient) {
            return $routeParams.role === 'user' ? UserClient : AdminClient;
        };
//    // Public API here
//    return new function(){ $log.info('in constructor');}; // $routeParams.role == 'user' ? UserClient : AdminClient;
    });
