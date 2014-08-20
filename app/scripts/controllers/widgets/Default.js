'use strict';


/**
 *
 *
 *  Default controller for a widget with a view.
 *  It uses the blank widget for the API with the backend
 *
 *  This controller simulates a real customer using the new widget
 *
 *
 *
 */
angular.module('cloudifyWidgetUiApp')
    .controller('WidgetsDefaultCtrl', function ($scope, LoginTypesService, WidgetsService, $log, $window, $routeParams, $sce, WidgetConstants) {
        $scope.widgetId = $routeParams.widgetId;
        $scope.currentTime = new Date().getTime();

        // this controller will handle post/receive messages !
        // it will also hold the state for the view (which is now coupled inside Widget.js controller, and should be extracted from there)


        $scope.getGoogle = function () {

            return '/#/widgets/' + $routeParams.widgetId + '/blank?timestamp=' + new Date().getTime();
        };
//        $scope.$watch('widget', function (n/*, o, s*/) {
//            n && ($scope.blankIframeSrc = $sce.trustAsResourceUrl(window.location.origin + ));
//        });


        // todo : move to "blank"
//        $window.$windowScope = $scope;   // used to close the login dialog

//        $scope.collapseAdvanced = false;

        $scope.widgetStatus = {};

        var STATE_RUNNING = 'RUNNING';
        var STATE_STOPPED = 'STOPPED';
        var ellipsisIndex = 0;


        $scope.showPlay = function () {
            return $scope.widgetStatus.state === STATE_STOPPED;
        };

        $scope.showStop = function () {
            return $scope.widgetStatus.state === STATE_RUNNING;
        };


        function _resetWidgetStatus() {
            $scope.widgetStatus = {
                'state': STATE_STOPPED,
                'reset': true
            };
        }

        _resetWidgetStatus();

        // advanced section currently deprecated
//        function _hasAdvanced() {
//            return $scope.advancedParams;
//        }

//        function _getAdvanced() {
//            return $scope.advancedParams;
//        }

        function _scrollLog() {
            var log = $('#log')[0];
            log.scrollTop = log.scrollHeight;
        }

        function _handleStatus(status) {
            $log.debug(['got status', status]);

            ellipsisIndex = ellipsisIndex + 1;
            $scope.widgetStatus = status;
            _scrollLog();
        }

        /****************** Login Feature , todo: move to blank ***********************/
            // use this with the following from the popup window:
            //
//        $scope.loginDone = function () {
//            $log.info('login is done');
//            if (popupWindow !== null) {
//                popupWindow.close();
//                popupWindow = null;
//            }
//
//            $scope.loginDetails = {};   // we will verify this in the backend
//            $timeout(function () {
//                $scope.play();
//            }, 0);
//        };

//        var popupWindow = null;
        $scope.play = function () {

//            if (!!$scope.widget.socialLogin && !!$scope.widget.socialLogin.data && $scope.widget.socialLogin.data.length > 0 && !$scope.loginDetails) {
//
//                var size = LoginTypesService.getIndexSize();
//
//                var left = (screen.width / 2) - (size.width / 2);
//                var top = (screen.height / 2) - (size.height / 2);
//
//                popupWindow = $window.open('/#/widgets/' + $scope.widget._id + '/login/index', 'Enter Details', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + size.width + ', height=' + size.height + ', top=' + top + ', left=' + left);
//                return;
//            }

            _resetWidgetStatus();
            $scope.widgetStatus.state = STATE_RUNNING;
//            var advancedParams = _hasAdvanced() ? _getAdvanced() : null;
//            console.log('advanced params: ', advancedParams, '_hasAdvanced()=', _hasAdvanced());

            _postPlay($scope.widget, /*advancedParams*/null, /*_isRemoteBootstrap()*/false);

        };

        $scope.stop = function () {
            _postStop($scope.widget, $scope.executionId, false /*_isRemoteBootstrap()*/);
        };

//        $scope.getFormPath = function (widget) {
//            if (widget.remoteBootstrap && widget.remoteBootstrap.cloudifyForm) {
//                return '/views/widget/forms/' + widget.remoteBootstrap.cloudifyForm + '.html';
//            }
//            return '';
//        };


        WidgetsService.getPublicWidget($routeParams.widgetId).then(function (result) {
            $scope.widget = result.data;
            $scope.videoUrl = $sce.trustAsHtml($scope.widget.embedVideoSnippet);
        });


//        var emptyList = [];

//        function _handleOutput(widget, output) {
//
//            if (!widget || !$scope.executionId) {
//                $scope.output = emptyList;
//            }
//            $scope.output = output;
//        }

//        function _isRemoteBootstrap() {
//            return $scope.widget.remoteBootstrap && $scope.widget.remoteBootstrap.active;
//        }


        // post outgoing messages
        function _postPlay(widget, advancedParams, isRemoteBootstrap) {
            _postMessage({name: 'widget_play', widget: widget, advancedParams: advancedParams, isRemoteBootstrap: isRemoteBootstrap});
        }

        function _postStop(widget, executionId, isRemoteBootstrap) {
            _postMessage({name: 'widget_stop', widget: widget, executionId: executionId, isRemoteBootstrap: isRemoteBootstrap});
        }

        function _postMessage(data) {
            $log.info('posting message to widget api frame, message data: ', data);
            // TODO frame ref should not be hard-coded
            var widgetFrameWindow = $window.frames[0];

            widgetFrameWindow.postMessage(data, /*$window.location.origin*/ '*');
        }

        // listen to incoming messages
        $window.addEventListener('message', function (e) {
            $scope.$apply(function () {
                $log.info('- got message from widget api frame: ', e.data);
                if (!e.data) {
                    $log.error('unable to handle received message, no data was found');
                    return;
                }
                var data = e.data;

                if (data.name === WidgetConstants.STATUS) {
                    _handleStatus(data.data);
                }

                if (data.name === WidgetConstants.PLAYED) {
                    $scope.executionId = data.executionId;
                }

                if (data.name === WidgetConstants.STOPPED) {
                    $scope.widgetStatus.state = STATE_STOPPED;
                    _resetWidgetStatus();
                }

            });

        });

    });
