'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AccountPoolCtrl', function ($scope, AccountPoolCrudService, $routeParams) {
        $scope.name = 'pools page';

        $scope.getPools = function () {
            AccountPoolCrudService.getPools().then(function (result) {
                $scope.pools = result.data;
            });
        };

        $scope.getPools();

        $scope.poolId = $routeParams.poolId;

//        $scope.updatePool = function (poolId, )
    });
