'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('WidgetCrudCtrl', function ($scope, $routeParams, $log, LoginTypesService, WidgetsService, $location, WidgetThemesService, $window /*,$timeout*/) {



        $scope.availableLoginTypes = function () {
            return LoginTypesService.getAll();
        };


        function _getSocialLoginById(id) {
            if (!!$scope.widget && !!$scope.widget.socialLogin && !!$scope.widget.socialLogin.data) {
                for (var i = 0; i < $scope.widget.socialLogin.data.length; i++) {
                    var socialLogin = $scope.widget.socialLogin.data[i];
                    if (id === socialLogin.id) {
                        return socialLogin;
                    }
                }

            }
            return null;

        }


        // use this with the following from the popup window:
        //
        $scope.loginDone = function () {
            $log.info('login is done');
            if (popupWindow !== null) {
                popupWindow.close();
                popupWindow = null;
            }
        };

        var popupWindow = null;

        $scope.tryItNow = function (socialLogin, widget) {
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

            popupWindow = window.open(url, 'Enter Details', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + size.width + ', height=' + size.height + ', top=' + top + ', left=' + left);
        };

        $scope.isTypeSupportsMailchimp = function (socialLogin) {
            if (!!socialLogin && !!socialLogin.id) {
                return !!LoginTypesService.getById(socialLogin.id).data.mailchimp;
            } else {
                return false;
            }
        };

        $scope.getSocialLoginLabel = function (socialLogin) {
            if (!!socialLogin && !!socialLogin.id) {
                return LoginTypesService.getById(socialLogin.id).label;
            } else {
                return 'N/A';
            }
        };

        $scope.loginTypeSelected = function (loginType) {
            return _getSocialLoginById(loginType.id) !== null;
        };

        $scope.addLoginType = function (loginType) {

            if (_getSocialLoginById(loginType.id)) {
                $log.info('social login %s already exists', loginType.id);
                return;
            }

            if (!$scope.widget) {
                return;
            }

            if (!$scope.widget.socialLogin) {
                $scope.widget.socialLogin = {};
            }

            if (!$scope.widget.socialLogin.data) {
                $scope.widget.socialLogin.data = [];
            }

            $scope.widget.socialLogin.data.push({'id': loginType.id });
        };

        $scope.removeSocialLogin = function (socialLogin) {
            var data = $scope.widget.socialLogin.data;
            var indexOf = data.indexOf(socialLogin);
            if (indexOf >= 0) {
                data.splice(indexOf, 1);
            }
        };

        $scope.remoteBootstrapForms = [
            {
                'label': 'HP  Folsom',
                'id': 'hp_folsom'
            },
            {
                'label': 'Softlayer',
                'id': 'softlayer'
            }
        ];


        $scope.themes = WidgetThemesService.themes;

        $scope.recipeTypes = [
            {
                'label': 'Application',
                'id': 'application',
                'installCommand': 'install-application'
            },
            {
                'label': 'Service',
                'id': 'service',
                'installCommand': 'install-service'
            }
        ];

        $scope.widget = {};
        var widgetId = $routeParams.widgetId;
        if (!!widgetId) {
            $log.info('loading widget ' + widgetId);
            WidgetsService.getWidget(widgetId).then(
                function success(data) {
                    $log.info('successfully loaded widget with id  ' + widgetId);
                    $scope.widget = data.data;
                },
                function error() {
                    $log.error('unable to load widget with id ' + widgetId);
                }
            );
        }


        function redirectToWidgets() {
            $location.path('/widgets');
        }

        $scope.delete = function () {
            WidgetsService.deleteWidget($scope.widget);
            redirectToWidgets();
        };

        $scope.view = function () {
            $scope.update().then(function () {
                $location.path('/widgets/' + $scope.widget._id + '/read');
            });
        };

        $scope.update = function () {
            return WidgetsService.updateWidget($scope.widget).then(
                function success() {
                    $log.info('successfully updated the widget');
                    toastr.info('successfully updated the widget');

                },
                function error() {
                    toastr.error('unknown error');
                    $log.error('unable to update the widget');
                }
            );
        };

        $scope.done = function () {
            redirectToWidgets();
        };

        $scope.create = function () {

            $log.info('creating new widget', $scope.widget);

            WidgetsService.createWidget($scope.widget).then(
                function success() {
                    $log.info('successfully created widget');
                    redirectToWidgets();
                },
                function error() {
                    $log.info('error creating widget');
                }
            );
        };

        WidgetsService.listPools().then(
            function success(result) {
                $scope.userPools = result.data;
            },
            function error(cause) {
                $scope.userPools = undefined;
                $log.error('error getting pools list - ' + cause.data);
            }
        );
    });
