/**
 * Created by sefi on 9/29/14.
 */

'use strict';

angular.module('cloudifyWidgetUiApp')
    .directive('poolForm', function ( $log, $location, PoolConstants) {
        return {
            templateUrl: 'views/directives/accountPoolForm.html',
            restrict: 'A',
            scope: { poolSettings: '=', actionCallback:'&', actionCaption:'@' },
            link: function (scope/*, element, attrs*/) {
                scope.poolApprovalModes = PoolConstants.APPROVAL;
                scope.allowSearch = true;

                scope.navigateTo = function(section) {
                    if (scope.allowSearch) {
                        $location.search('section', section);
                    } else {
                        $location.search('section', null);
                    }
                };

                scope.validate = function (poolForm) {
                    if (scope.poolSettings.minNodes > scope.poolSettings.maxNodes) {
                        poolForm.$setValidity('minmax', false);
                    } else {
                        poolForm.$setValidity('minmax', true);
                    }
                };

                scope.actionClicked = function () {
                    scope.allowSearch = false;
                    scope.actionCallback();
                };

            }
        };
    });