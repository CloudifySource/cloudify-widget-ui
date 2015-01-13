'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('WidgetCrudCtrl', function ($scope, $routeParams, $log, $timeout, LoginTypesService, GoogleplusLoginService, WidgetsService, $location, WidgetThemesService, LoginService/*,$timeout*/) {

        $scope.availableLoginTypes = function () {
            return LoginTypesService.getAll();
        };

        $scope.tryItNow = {};

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
        $scope.loginDone = function (loginDetailsId) {
            $log.info('login is done');
            $scope.loginDetailsId = loginDetailsId;

            if (popupWindow !== null) {
                popupWindow.close();
                popupWindow = null;
            }
        };

        var popupWindow = null;

        $scope.trySocialLoginNow = function (socialLogin, widget) {
            if ( !socialLogin || socialLogin.id !== 'googleplus') {
                popupWindow = LoginService.performSocialLogin(socialLogin, widget, $scope);
            }
        };

        $scope.tryPrivateImagesNow = function (isAdd) {
            return WidgetsService.tryPrivateImagesNow(isAdd, $scope.tryItNow.apiKey, $scope.tryItNow.secretKey, $scope.widget.executionDetails.privateImages).then(
                function success() {
                    $log.info('Successfully modified images');
                    toastr.info('Successfully modified images');

                },
                function error(err) {
                    toastr.error(err.data.error);
                    $log.error(err.data.error);
                }
            );
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


            $log.info('adding ', loginType );
            if ( loginType.id === 'googleplus'){
                $log.info('will render googleplus');
                $timeout(function(){
                    GoogleplusLoginService.render(function(){});
                });
            }
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

        $scope.addPrivateImageItem = function() {
            if (!$scope.widget.executionDetails.privateImages) {
                $scope.widget.executionDetails.privateImages = [];
            }

            $scope.widget.executionDetails.privateImages.push({});
        };

        $scope.removePrivateImageItem = function(index) {
            $scope.widget.executionDetails.privateImages.splice(index, 1);
        };

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

            if (!$scope.widget.executionDetails) {
                // if there are no executionDetails defined, default to non-solo mode.
                $scope.widget.executionDetails = {
                    isSoloMode: false
                };
            }

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

        $scope.navigateTo = function (section) {
            $location.search('section', section);
        };

        $timeout(function(){
            GoogleplusLoginService.render(function(){});
        },1000);
    });
