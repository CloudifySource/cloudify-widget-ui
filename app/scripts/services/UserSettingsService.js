'use strict';

/**
 * @ngdoc service
 * @name cloudifyWidgetUiApp.UserSettingsService
 * @description
 * # UserSettingsService
 * Service in the cloudifyWidgetUiApp.
 */
console.log('loading user settings');
angular.module('cloudifyWidgetUiApp')
    .service('UserSettingsService', function ($http) {

        this.changePassword = function (details) {
            return $http.post('/backend/userSettings/changePassword', details);
        };

    });
