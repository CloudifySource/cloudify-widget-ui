'use strict';

angular.module('cloudifyWidgetUiApp')
    .directive('blankFrame', function ($routeParams, $log) {
        return {
            restrict: 'A',
            link: function postLink(scope, element/*, attrs*/) {
                $log.info('loading blank iframe from directive');
                var src = 'index.html#/widgets/' + $routeParams.widgetId + '/blank?timestamp=' + new Date().getTime();
                element.append($('<iframe></iframe>', {'src': src, 'post-message-enabled':'enabled'}));
//        element.text('this is the blankFrame directive');
            }
        };
    });
