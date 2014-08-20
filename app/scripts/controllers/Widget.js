'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('WidgetCtrl', function ($scope, LoginTypesService, WidgetsService, $log, $window, $routeParams, PostParentService, $localStorage, $timeout, WidgetConstants) {

        $log.info('loading widget controller : ' + new Date().getTime());
        // we need to hold the running state to determine when to stop sending status/output messages back
        $scope.widgetStatus = {};
        var STATE_RUNNING = 'RUNNING';
        var STATE_STOPPED = 'STOPPED';


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

        $scope.widget =  {  '_id' : $routeParams.widgetId };
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



        function play (widget, advancedParams, isRemoteBootstrap) {
            $log.info('playing widget');
            _resetWidgetStatus();
            $scope.widgetStatus.state = STATE_RUNNING;

            WidgetsService.playWidget(widget, advancedParams, isRemoteBootstrap)
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
            WidgetsService.stopWidget($scope.widget, $scope.executionId ).then(function () {
                deleteState();
                _postStopped(executionId);
                _resetWidgetStatus();
                $scope.executionId = null;
            });
        }

        function _resetWidgetStatus() {
            $scope.widgetStatus = {
                'state': STATE_STOPPED,
                'reset': true
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

            if (data.name === WidgetConstants.PLAY) {
                play(data.widget, data.advancedParams, data.isRemoteBootstrap);
            }

            if (data.name === WidgetConstants.STOP) {
                stop(data.widget, data.executionId, data.isRemoteBootstrap);
            }

            // this is here because JSHint fails at switch case indentation so it was converted to if statements.
            if (data.name === WidgetConstants.PARENT_LOADED) {
            }

        });

        parentLoaded();
        $timeout(loadState,1);
    });
