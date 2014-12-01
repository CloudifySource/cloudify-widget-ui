'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AdminMyUserCtrl', function ($scope, $http) {

        $scope.page = {};


        $scope.resetChanges = function () {
            $http.get('/backend/admin/myUser').then(function (result) {
                $scope.myUser = result.data;
            });
        };

        $scope.resetChanges();


        $scope.testPoolKey = function () {
            $scope.page.message = null;
            $http.post('/backend/admin/myUser/testAdminPoolKey', { 'poolKey': $scope.myUser.poolKey }).then(function () {
                $scope.page.message = 'success';
            }, function () {
                $scope.page.message = 'error!';
            });
        };

        $scope.setPoolKey = function (newPoolKey) {
            $scope.page.message = null;
            $http.post('/backend/admin/myUser/setPoolKey', { 'poolKey': newPoolKey }).then(function (result) {
                    $scope.myUser = result.data;
                    $scope.page.message = 'operation was a success';
                },
                function (result) {
                    var message = result.data;
                    if (result.data.hasOwnProperty('message')) {
                        message = result.data.message;
                    }
                    $scope.page.message = 'error! ' + message;
                });
        };
    });
