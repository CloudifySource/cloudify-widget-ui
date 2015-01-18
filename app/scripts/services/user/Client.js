'use strict';

angular.module('cloudifyWidgetUiApp')
    .service('UserClient', function UserClient($log) {
        this.name = 'user client';
        $log.info('initializing user client');
        // AngularJS will instantiate a singleton by calling "new" on this function
    });
