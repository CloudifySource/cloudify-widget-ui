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
        var STATE_RUNNING = 'RUNNING';
        var STATE_STOPPED = 'STOPPED';
        var ellipsisIndex = 0;

        $scope.widgetId = $routeParams.widgetId;
        $scope.currentTime = new Date().getTime();
        $scope.widgetState = STATE_STOPPED;
        $scope.output = '';

        // this controller will handle post/receive messages !
        // it will also hold the state for the view (which is now coupled inside Widget.js controller, and should be extracted from there)


        $scope.getGoogle = function () {

            return '/#/widgets/' + $routeParams.widgetId + '/blank?timestamp=' + new Date().getTime();
        };

        // todo : move to "blank"
//        $window.$windowScope = $scope;   // used to close the login dialog

//        $scope.collapseAdvanced = false;

        $scope.showPlay = function () {
            return $scope.widgetState === STATE_STOPPED;
        };

        $scope.showStop = function () {
            return $scope.widgetState === STATE_RUNNING;
        };


        function _resetWidgetStatus() {
            $scope.widgetState = STATE_STOPPED;
            $scope.widgetStatus = {};
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
            updateWidgetStatus(status);

            ellipsisIndex = ellipsisIndex + 1;
            $scope.output = status.output || '';
            _scrollLog();
        }

        function updateWidgetStatus(status) {
            if (!$scope.widgetStatus) {
                $scope.widgetStatus = {};
            }

            $scope.widgetStatus.nodeModel = status.nodeModel;

            if (status.nodeModel && status.nodeModel.publicIp) {
                $scope.widgetStatus.consoleLink = $scope.widget.consoleLink;
                $scope.widgetStatus.consoleLink.link = $scope.widget.consoleLink.link.replace('$HOST', status.nodeModel.publicIp);
            }

            $scope.widgetStatus.instanceIsAvailable = (status.exitStatus && status.exitStatus.code === 0);

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
            $scope.output = '';
//            $scope.widgetState = STATE_RUNNING;
//            var advancedParams = _hasAdvanced() ? _getAdvanced() : null;
//            console.log('advanced params: ', advancedParams, '_hasAdvanced()=', _hasAdvanced());

            _postPlay($scope.widget);
        };

        $scope.stop = function () {
            _postStop($scope.widget, $scope.executionId);
        };

        $scope.getFormPath = function (/*widget*/) {
            // todo: remove from comment when we want to support more cloud types. For now, just return the EC2 form.
//            if (widget.executionDetails && widget.executionDetails.isSoloMode && widget.executionDetails.cloudifyForm) {
//                return '/views/widget/forms/' + widget.remoteBootstrap.cloudifyForm + '.html';
//            }
//            return '';
            return '/views/widget/forms/ec2.html';
        };


        WidgetsService.getPublicWidget($routeParams.widgetId).then(function (result) {
            $scope.widget = result.data;
            $scope.videoUrl = $sce.trustAsHtml($scope.widget.embedVideoSnippet);
        });


//        var emptyList = [];

        // post outgoing messages
        function _postPlay(widget) {
            _postMessage({name: 'widget_play', widget: widget});
        }

        function _postStop(widget, executionId) {
            _postMessage({name: 'widget_stop', widget: widget, executionId: executionId});
        }

        // code for testing recipe properties message.
//        function _postProperties() {
//            _postMessage({
//                name: 'widget_recipe_properties',
//                data: [
//                    {
//                        key: 'key1',
//                        value: 'value1'
//                    },
//                    {
//                        key: 'key2',
//                        value: 1234
//                    }
//                ]
//            });
//        }
//
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

                // code for testing recipe properties message.
//                if (data.name === 'widget_loaded') {
//                    _postProperties();
//                }
//
                if (data.name === WidgetConstants.STATUS) {
                    _handleStatus(data.data);
                }

                if (data.name === WidgetConstants.PLAYED) {
                    $scope.widgetState = STATE_RUNNING;
                    $scope.executionId = data.executionId;
                }

                if (data.name === WidgetConstants.STOPPED) {
                    _resetWidgetStatus();
                }

            });

        });

    });
