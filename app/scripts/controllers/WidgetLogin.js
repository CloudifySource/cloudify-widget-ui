'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('WidgetLoginCtrl', function ($scope, $routeParams, GoogleplusLoginService,  WidgetsService, LoginTypesService, $log, $timeout ) {

        $log.info('loading');
        $scope.page = { loading: true };
        WidgetsService.getPublicWidget($routeParams.widgetId).then(function (result) {
            $scope.widget = result.data;
            $timeout( $scope.renderSignIn, 1000);
        });

        $scope.loginTypes = function (ids) {
            if (!ids) {
                return [];
            }
            var result = [];
            for (var i = 0; i < ids.length; i++) {
                result.push(LoginTypesService.getById(ids[i].id));
            }
            console.log(result);
            return result;
        };


        $scope.getIcon = function( login ){
            if ( login.id === 'custom'){
                return 'fa-sign-in';
            }
            if ( login.id === 'google'){
                return 'fa-google';
            }
        };

        $scope.hasGoogleplus = function(){
            if ( !!$scope.widget && !!$scope.widget.socialLogin && !!$scope.widget.socialLogin.data ) {
                return !!_.find($scope.widget.socialLogin.data, {'id' : 'googleplus'});
            }else{
                $log.debug('cannot decide if google plus exists. widget not on scope');
            }
            return false;
        };

        // google+ code! http://stackoverflow.com/a/20849575
        $scope.processGoogleplusAuth = function(authResult) {
            if ( !!authResult && !!authResult.code) {
                $.post('/backend/widgets/' + $routeParams.widgetId + '/login/googleplus/callback', { code: authResult.code})
                    .done(function(/*data*/) {
                        window.opener.$windowScope.loginDone('__id__');
                    });

            }
        };

        $scope.renderSignIn = function() {
            $log.info('rendering signin');
            GoogleplusLoginService.render($scope.processGoogleplusAuth);
        };

        $timeout( function(){
            $scope.page.loading = false;
        }, 3000);
    });
