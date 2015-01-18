'use strict';

angular.module('cloudifyWidgetUiApp')
    .service('AdminClient', function AdminClient($log) {
        this.name = 'admin client';
        $log.info('initializing admin client');
    });
