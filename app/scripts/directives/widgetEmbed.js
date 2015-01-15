'use strict';

angular.module('cloudifyWidgetUiApp')
    .directive('widgetEmbed', function (WidgetThemesService, TextContentCompiler, $rootScope, $log, $timeout, $window) {
        return {
            // for example <iframe .... src="http://localhost.com:9000/widgets/WIDGET_ID/view"></iframe>
            template: '<iframe width="{{getIframeWidth()}}" height="{{getIframeHeight()}}" scrolling="no" src="{{getIframeSrc()}}"></iframe>',
            restrict: 'A',
            scope: {
                'widget': '=',
                'theme': '='
            },
            controller: function ($scope, $element, $compile) {


                var theme;
                var contents = $element.html();

                $scope.timestamp = new Date().getTime();


                function getThemeFromScope() {

                    if (!!$scope.theme) {
                        return WidgetThemesService.getThemeById($scope.theme);
                    } else if (!!$scope.widget.theme) {
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
                    var result = '';
                    if (!!$scope.widget && !!$scope.widget._id) {
                        result =  $scope.getHost() + '/#/widgets/' + $scope.widget._id + '/view?timestamp=' + $scope.timestamp;
                    }

                    if ( !!$scope.theme ){
                        result += '&theme=' + $scope.theme;
                    }
                    return result;
                };


                $scope.$watch('widget', function () {
                    theme = getThemeFromScope();
                    $scope.compileToText();
                }, true);

                $scope.$watch('theme', function () {
                    theme = getThemeFromScope();
                    $scope.compileToText();

                });

                $scope.$watch('widget', function () {
                    $scope.timestamp = new Date().getTime();
                }, true);

                $scope.getHost = function () {
                    return $window.location.origin;
                };


                $scope.compileToText = function () {
                    if ($scope.asCode) {
                        $element.empty();
                        var compiledHTML = $compile(contents)($scope);
                        $timeout(function () { // need this because compiling is on event queue so we register right after it.http://stackoverflow.com/a/18600499/1068746
                            var outerHTML = compiledHTML[0].outerHTML;
                            $element.append($('<textarea></textarea>', { 'html': outerHTML}));
                            $log.info(outerHTML);
                        }, 0);
//                        $element.text($tmpDiv.text().html());
//                        $log.info($element.text());
                    }
//                    $log.info($compile($element.contents())($scope));
//                    TextContentCompiler.asText($scope, $element, 'iframe', ['ng-src']);
                };

            },
            link: function postLink(scope, element, attrs) {
                if (attrs.asCode) {
                    scope.asCode = true;
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
                 */
                /*


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
                 */
                /*

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
