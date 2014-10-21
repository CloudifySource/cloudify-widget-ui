'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('WidgetCtrl', function ($scope, LoginService, LoginTypesService, WidgetsService, $log, $window, $routeParams, PostParentService, $localStorage, $timeout, WidgetConstants) {

        $log.info('loading widget controller : ' + new Date().getTime());
        // we need to hold the running state to determine when to stop sending status/output messages back
        $scope.widgetStatus = {};
        var STATE_RUNNING = 'RUNNING';
        var STATE_STOPPED = 'STOPPED';
        var popupWindow = null;

        // when there's an executionId, lets start polling...
        $scope.$watch('executionId', function( newValue, oldValue ){
            $log.info('executionId changed', newValue, oldValue);
            if ( !!newValue && !oldValue ){
                $log.info('detected executionId exists, starting poll');
                $scope.widgetStatus.state = STATE_RUNNING;
                _pollStatus(1, { '_id' : $scope.widget._id }, newValue.executionId);
            }

            if ( !newValue ){
                _resetWidgetStatus();
            }
        });

        // this is to first init the widget on the scope with the bare minimum - the id.
        // then, async, go fetch the entire thing and override.
        $scope.widget =  {  '_id' : $routeParams.widgetId };
        WidgetsService.getPublicWidget($routeParams.widgetId).then(function (result) {
            $scope.widget = result.data;
        });

        $scope.executionId = null;

        function saveState(){
            localStorage.setItem( $scope.widget._id, JSON.stringify($scope.executionId) );
        }

        function deleteState(){
            localStorage.removeItem( $scope.widget._id );
        }

        function loadState(){
            var executionId = JSON.parse(localStorage.getItem( $scope.widget._id ));
            if ( !!executionId ){
                $log.info('resuming execution.. found execution in local storage');
                $scope.executionId = executionId;
            }
        }

        // use this with the following from the popup window:
        // this is called when social logic is complete.
        $scope.loginDone = function (loginDetailsId) {
            $log.info('login is done');
            $scope.loginDetailsId = loginDetailsId;

            if (popupWindow !== null) {
                popupWindow.close();
                popupWindow = null;
            }

            // social login is complete, now play.
            playInternal();
        };

        function play (widget, advancedParams, isRemoteBootstrap) {
            //check if social login is required
            var socialLoginRequired = false;
            if (widget.socialLogin && widget.socialLogin.data && widget.socialLogin.data.length !== 0) {
                socialLoginRequired = $scope.find( widget.socialLogin.data, { 'enabled' : true} ) !== undefined;
            }

            $scope.widget = widget;
            $scope.advancedParams = advancedParams;
            $scope.isRemoteBootstrap = isRemoteBootstrap;

            if (socialLoginRequired) {
                // show the social login popup
                popupWindow = LoginService.performSocialLogin(/*socialLogin*/null, widget, $scope);
            } else {
                // no social login, just play.
                playInternal();
            }
        }

        function playInternal () {
            $log.info('playing widget');
            _resetWidgetStatus();
            $scope.widgetStatus.state = STATE_RUNNING;

            WidgetsService.playWidget($scope.widget, $scope.advancedParams, $scope.isRemoteBootstrap, $scope.loginDetailsId)
                .then(function (result) {
                    $log.info(['play result', result]);

                    $scope.executionId = result.data;
                    saveState();

                    _postPlayed($scope.executionId);
                }, function (err) {
                    $log.info(['play error', err]);
                });
        }

        function parentLoaded(){
            $log.info('posting widget_loaded message');
            _postMessage({'name' : 'widget_loaded'});
        }

        function stop (widget, executionId) {
            //first, stop polling for status (resolves race condition - getStatus before stop finished).
            _resetWidgetStatus();

            // now stop widget
            WidgetsService.stopWidget($scope.widget, $scope.executionId.executionId).then(function () {
                deleteState();
                _postStopped(executionId);
                $scope.executionId = null;
            });
        }

        function _resetWidgetStatus() {
            var output = $scope.widgetStatus.output;

            $scope.widgetStatus = {
                'state': STATE_STOPPED,
                'reset': true,
                'output': output
            };
        }

        function _handleStatus(status, myTimeout, widget, executionId) {

            if ( !!status && !!status.output ) {
                status.output = status.output.split('\n');
            }
            $scope.widgetStatus = status;
            _postStatus(status);
            $timeout(function () {
                _pollStatus(false, widget, executionId);
            }, myTimeout || 3000);

            // if expires < now, call stop()
            if (!status.nodeModel || status.nodeModel.expires < new Date().getTime()) {
                stop(widget, executionId);
            }
        }

        function _pollStatus(myTimeout, widget, executionId) {
            $log.debug('polling status');
            if ($scope.widgetStatus.state !== STATE_STOPPED) { // keep polling until widget stops ==> mainly for timeleft..
                WidgetsService.getStatus(widget._id, executionId).then(function (result) {
                    if (!result) {
                        return;
                    }
                    _handleStatus(result.data, myTimeout, widget, executionId);
                }, function (result) {
                    $log.error(['status error', result]);
                });
            }
        }

        // post outgoing messages

        function _postStatus (status) {
            _postMessage({name: 'widget_status', data: status});
        }


        function _postPlayed () {
            _postMessage({name: 'widget_played', executionId: $scope.executionId});
        }

        function _postStopped (executionId) {
            _postMessage({name: 'widget_stopped', executionId: executionId});
        }

        function _postMessage(data) {
            if ( $window.parent !== $window ) {
                $window.parent.postMessage(data, /*$window.location.origin*/ '*');
            }
        }



//        $log.debug('listening to messages on ', $window);
        // listen to incoming messages
        $window.addEventListener('message', function (e) {
            $log.info('- - - blank received message, user posted: ', e.data);
            if (!e.data) {
                $log.error('unable to handle posted message, no data was found');
                return;
            }

            var data = e.data;

            if (typeof(data) === 'string') {
                data = JSON.parse(data);
            }

            if (data.name === WidgetConstants.PLAY) {
                play($scope.widget/*, data.advancedParams, data.isRemoteBootstrap*/); // currently support only non remote execution
            }

            if (data.name === WidgetConstants.STOP) {
                stop();
            }

            // this is here because JSHint fails at switch case indentation so it was converted to if statements.
            if (data.name === WidgetConstants.PARENT_LOADED) {
            }

        });

        parentLoaded();
        $timeout(loadState,1);
    });
