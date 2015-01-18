'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('LoginCtrl', function ($scope, $log, $http, $rootScope, $location) {

        $scope.needsLogin = false;

        $scope.page = {
            'email': null,
            'password': null
        };

        function redirect() {
            $http.get('/backend/user/loggedIn').then(function ( data ) {
                var user = data.data;

                if ( user.isAdmin ) {
                    $location.path('/admin/users');

                } else {
                    $location.path('/pools');

                }

            }, function () {
                $scope.needsLogin = true;
                $rootScope.pageError = '';
            });

        }

        $scope.login = function () {
            $scope.pageError = null;
            $http.post('/backend/login', $scope.page).then(
                function success() {
                    $log.info('successfully logged in');
//                    $location.path('/widgets');
                    redirect();
                },
                function error(result) {
                    $log.error('unable to login');
                    $scope.pageError = result.data.message;
                }
            );
        };

        redirect();

    });
