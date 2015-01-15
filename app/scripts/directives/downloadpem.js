'use strict';

/**
 * @ngdoc directive
 * @name cloudifyWidgetUiApp.directive:downloadPem
 * @description
 * # downloadPem
 */
angular.module('cloudifyWidgetUiApp')
    .directive('downloadPem', function ( ) {
        return {
            template: '<button class="btn btn-link" ng-show="hasPem()" ng-click="downloadPem()">download pem</button><button class="btn btn-link" ng-show="hasPem()" ng-click="showPem()">show pem</button><pre class="pem-content" ng-show="shouldShowPem">{{sshDetails.privateKey}}</pre>',
            restrict: 'A',
            scope: {
                'sshDetails': '=downloadPem'
            },
            link: function postLink(scope) {

                scope.shouldShowPem = false;

                scope.hasPem = function () {
                    return !!scope.sshDetails && !!scope.sshDetails.privateKey;
                };

                scope.showPem = function () {
                    scope.shouldShowPem = !scope.shouldShowPem;
                };

                scope.downloadPem = function () {
                    var pom = document.createElement('a');
                    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(scope.sshDetails.privateKey));
                    pom.setAttribute('download', 'pem.txt');
                    pom.click();
                };
            }
        };
    });
