'use strict';

angular.module('cloudifyWidgetUiApp')
    .directive('widgetEmbed', function (WidgetThemesService, TextContentCompiler, $rootScope, $log, $timeout, $window) {
        return {
            // for example <iframe .... src="http://localhost.com:9000/widgets/WIDGET_ID/view"></iframe>
            template: '<iframe width="{{getIframeWidth()}}" height="{{getIframeHeight()}}" scrolling="no" ng-src="{{getIframeSrc()}}"></iframe>',
            restrict: 'A',
            scope: {
                'widget': '=',
                'theme': '='
            },
            controller: function ($scope, $element) {

                var theme;
                $scope.timestamp = new Date().getTime();


                function getThemeFromScope(){

                    if ( !!$scope.theme){
                        return WidgetThemesService.getThemeById($scope.theme);
                    }else if ( !!$scope.widget.theme) {
                        return WidgetThemesService.getThemeById($scope.widget.theme);
                    }
                    return null;
                }

                $scope.getIframeWidth = function () {
                    if (!!theme) {
                        return theme.width;
                    }
                    return '';
                };

                $scope.getIframeHeight = function () {
                    if (!!theme) {
                        return theme.height;
                    }
                    return '';
                };

                $scope.getIframeSrc = function () {
                    if (!!$scope.widget && !!$scope.widget._id) {
                        return $scope.getHost() + '/#/widgets/' + $scope.widget._id + '/view?timestamp=' + $scope.timestamp;
                    }
                    return '';
                };


                $scope.$watch('widget', function(){
                      theme = getThemeFromScope();
                },true);

                $scope.$watch('theme', function(){
                    theme = getThemeFromScope();
                });

                $scope.$watch('widget', function () {
                    $scope.timestamp = new Date().getTime();
                }, true);

                $scope.getHost = function () {
                    return $window.location.origin;
                };

                $scope.compileToText = function () {
                    TextContentCompiler.asText($scope, $element, 'iframe', ['ng-src']);
                };

            },
            link: function postLink(scope, element, attrs) {

                if (attrs.asCode) {
                    scope.compileToText();
                }

/*

 var iframeEl = element.find('iframe');
 var iframeDomWindow = iframeEl[0].contentWindow;

                // listen to incoming messages
                iframeDomWindow.addEventListener('message', function (result) {
                    $log.info('- - - message received, user posted: ', result.data);
                    switch (result.data) {
                        case 'play':

                            // send event to call play
                            $timeout(function () {
                                scope.$broadcast('$incomingPostMessage', 'play');
                            }, 1000);

                            // emulate outgoing output response
*/
/*
                            $timeout(function () {
                                var w = findWindowByOrigin(result.origin, iframeDomWindow);
                                w.postMessage('loaded', $window.location.origin);
                            }, 1000);
*//*


                            break;
                        case 'data':
                            break;
                    }
                });
                $rootScope.apiIframeWindow = iframeDomWindow;


                */
/**
                 * traverses up the window hierarchy to find a window matching the origin address.
                 *
                 * @param origin the origin address ([protocol]://[host]:[port])
                 * @param w a window object to start the search from
                 * @returns {*}
                 *//*

                function findWindowByOrigin (origin, w) {
                    if (w.location.origin === origin) {
                        return w;
                    }
                    return findWindowByOrigin(origin, w.parent);
                }
*/

            }
        };
    });
