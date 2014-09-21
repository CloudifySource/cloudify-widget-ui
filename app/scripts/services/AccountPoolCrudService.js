/**
 * Created by sefi on 9/21/14.
 */

'use strict';

angular.module('cloudifyWidgetUiApp')
    .factory('AccountPoolCrudService', function ($http) {

        function AccountPoolCrudService() {
            this.getPools = function () {
                return $http.get('/backend/user/pools');
            };
        }

        return new AccountPoolCrudService();
    });
