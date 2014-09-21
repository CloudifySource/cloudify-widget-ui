/**
 * Created by sefi on 9/21/14.
 */

'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AccountPoolEditCtrl', function ($scope, AccountPoolCrudService, $routeParams) {
        $scope.name = 'pools page';
        $scope.poolId = $routeParams.poolId;

        $scope.getPool = function () {
            AccountPoolCrudService.getPool($routeParams.poolId).then(function (result) {
                $scope.pool = result.data;
            });
        };

        $scope.getPool();


//        $scope.updatePool = function (poolId, )
    });