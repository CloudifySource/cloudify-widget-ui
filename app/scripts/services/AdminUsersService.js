'use strict';

angular.module('cloudifyWidgetUiApp')
    .service('AdminUsersService', function AdminUsersService($http/*, $log*/) {
        // AngularJS will instantiate a singleton by calling "new" on this function
        this.getAll = function () {
            return $http.get('/backend/admin/users');
        };

        this.removePoolKey = function (user) {
            if (!user.poolKey) {
                return;
            }
            return $http.post('/backend/admin/users/' + user._id + '/removePoolKey');

        };

        this.getPoolManagerAccounts = function () {
            return $http.get('/backend/admin/accounts');
        };


        this.setPoolKey = function (user, poolKey) {
            if (!!user.poolKey) {
                if (!confirm('this user already has a pool key - are you sure you want to replace it?')) {
                    return;
                }
            }
            return $http.post('/backend/admin/users/' + user._id + '/setPoolKey', {'poolKey': poolKey });
        };

        this.setDescription = function (account, description) {
            return $http.post('/backend/admin/accounts/' + account.id + '/description', {'description': description });
        };

        this.assignNewPoolKey = function (user) {
            if (!!user.poolKey) {
                if (!confirm('this user already has a pool key - are you sure you want to replace it?')) {
                    return;
                }
            }
            return $http.post('/backend/admin/users/' + user._id + '/setPoolKey');
        };
    });
