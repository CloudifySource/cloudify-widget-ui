'use strict';

angular.module('cloudifyWidgetUiApp')
    .service('LoginService', function LoginService($http, $log, $window, LoginTypesService) {
        function _login(username, password) {
            $http.get('/backend/login', {'username': username, 'password': password}).then(
                function success() {
                    $log.info('successfully logged in', arguments);
                },
                function error() {
                    $log.error('unable to login', arguments);
                }
            );
        }
        this.login = _login;

        this.performSocialLogin = function (socialLogin, widget, $scope) {
            $window.$windowScope = $scope;

            var size = LoginTypesService.getIndexSize();

            var left = (screen.width / 2) - (size.width / 2);
            var top = (screen.height / 2) - (size.height / 2);

            var url = null;
            if (socialLogin === null) {
                url = '/#/widgets/' + $scope.widget._id + '/login/index';
            } else {
                url = '/backend/widgets/' + widget._id + '/login/' + socialLogin.id;
            }

            return $window.open(url, 'Enter Details', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + size.width + ', height=' + size.height + ', top=' + top + ', left=' + left);
        };
    });
