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

        /**
         *
         * @param {object} details
         * @param {string} details.poolKey
         * @returns {HttpPromise}
         */
        this.setPoolKey = function(details){
            return $http.post('/backend/admin/myUser/setPoolKey', details);
        };

        /**
         *
         * @param {object} details
         * @param {string} details.poolKey
         * @returns {HttpPromise}
         */
        this.testPoolKey = function(details){
            return $http.post('/backend/admin/myUser/testAdminPoolKey', details);
        };

        this.getUserSettings = function() {
            return $http.get('/backend/userSettings/read');
        }

    });
