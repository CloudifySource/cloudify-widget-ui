'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AdminUsersIndexCtrl', function ($scope, AdminUsersService, $log/*, $timeout*/) {

        var accounts = {};

        $scope.getAccounts = function () {
            return accounts;
        };


        function reloadAccounts() {
            $log.info('reloading accounts');
            AdminUsersService.getPoolManagerAccounts().then(function (result) {
                var list = result.data;
                for (var i = 0; i < list.length; i++) {
                    accounts[list[i].uuid] = list[i];
                }
            });
        }

        reloadAccounts();

        AdminUsersService.getAll().then(function (result) {
            $scope.users = result.data;
        });

        function _replaceUser(user, newUser) {
            var indexOf = $scope.users.indexOf(user);
            $scope.users[indexOf] = newUser;
        }

        $scope.removePoolKey = function (user) {
            AdminUsersService.removePoolKey(user).then(function (result) {
                _replaceUser(user, result.data);
            });
        };

        // gets the account from pool manager according to uuid
        $scope.getAccount = function (user) {

            if (!!user.poolKey && accounts.hasOwnProperty(user.poolKey)) {
                return accounts[user.poolKey];
            }
            return null;
        };

        $scope.setDescription = function (user, description) {
            var account = $scope.getAccount(user);
            if (account === null) {
                $log.error('only relevant for users with poolKey');
                $scope.pageError = 'only relevant for users with poolKey';
            } else {
                AdminUsersService.setDescription(account, description).then(function (result) {
                    accounts[result.data.uuid] = result.data;
                });
            }
        };

        $scope.setPoolKey = function (user, poolKey) {
            AdminUsersService.setPoolKey(user, poolKey).then(function (result) {
                _replaceUser(user, result.data);
                reloadAccounts();
            });


        };

        $scope.assignNewPoolKey = function (user) {
            AdminUsersService.assignNewPoolKey(user).then(function (result) {
                _replaceUser(user, result.data);
                reloadAccounts();
            });


        };
    });
