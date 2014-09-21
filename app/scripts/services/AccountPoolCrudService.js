/**
 * Created by sefi on 9/21/14.
 */

'use strict';

angular.module('cloudifyWidgetUiApp')
    .factory('AccountPoolCrudService', function ($http) {

        function AccountPoolCrudService() {
            this.getPools = function () {
                return $http.get('/backend/user/account/pools');
            };

            this.getPool = function (poolId) {
                return $http.get('/backend/user/account/pools/' + poolId);
            };

            this.updatePool = function (poolId, poolSettings) {
                return $http.post('/backend/user/account/pools/' + poolId, poolSettings);
            };
        }

        return new AccountPoolCrudService();
    });
