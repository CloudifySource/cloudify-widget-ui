'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AdminWidgetReadCtrl', function ($scope, $routeParams, WidgetsService) {
        $scope.widgetId = $routeParams.widgetId;
        $scope.theme = $routeParams.theme || 'default';

        WidgetsService.getWidget($scope.widgetId).then(
            function success(data) {
                $scope.widget = data.data;
            },
            function error(response) {
                toastr.error('error loading widget', response.data);
            });
    });
