'use strict';

/**
 * @ngdoc directive
 * @name cloudifyWidgetUiApp.directive:section
 * @description
 * # section
 */
angular.module('cloudifyWidgetUiApp')
    .directive('section', function ($route, $log) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                $log.info('active section', $route.current.$$route.section, attrs.section);
                if ($route.current.$$route.section === attrs.section) {
                    element.addClass('active-section');
                } else {
                    element.removeClass('active-section');
                }

            }
        };
    });
