'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('UserSettingsCtrl', function ($scope, $http, WidgetClient, $log ) {

        $scope.page = {};


        $scope.resetChanges = function () {
            $http.get('/backend/userSettings/read').then(function (result) {
                $scope.myUser = result.data;
            });
        };

        $scope.resetChanges();


        $scope.changePassword = function(){
            $log.info('changing password');
            WidgetClient.userSettings.changePassword($scope.page.changePassword).then(function(){
                toastr.success('password updated');
            }, function( result ){

                toastr.error( result.data.error, 'error updating password' );
            });
        };


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
