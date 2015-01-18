'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('WidgetViewCtrl', function ($scope, WidgetsService, $routeParams, $log) {

        $log.info('in widget view');

        WidgetsService.getPublicWidget($routeParams.widgetId).then(function (result) {
            $scope.widget = result.data;
        });


        var timestamp = new Date().getTime();
        $scope.getInclude = function () {
            if (!$scope.widget) {
                return '';
            } else {
                $log.info('widget theme is',$scope.widget.theme);
                var widgetTheme = $routeParams.theme || $scope.widget.theme || 'default';
                return 'views/widget/themes/' + widgetTheme + '.html?timestamp=' + timestamp ;
            }
        };


    });
