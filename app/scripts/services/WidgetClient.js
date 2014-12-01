'use strict';

angular.module('cloudifyWidgetUiApp')
    .service('WidgetClient', function WidgetClient(AdminUsersService) {
        // AngularJS will instantiate a singleton by calling "new" on this function

        this.adminUsers = AdminUsersService;
    });
