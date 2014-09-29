/**
 * Created by sefi on 9/21/14.
 */

'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AccountPoolCrudCtrl', function ($scope, AccountPoolCrudService, $routeParams, $location, $log, PoolConstants) {
        $scope.name = 'pools page';
        $scope.poolId = $routeParams.poolId;
        $scope.poolApprovalModes = PoolConstants.APPROVAL;

        $scope.getPool = function () {
            AccountPoolCrudService.getPool($scope.poolId).then(function (result) {
                $scope.pool = result.data;
            });
        };

        $scope.getPoolStatus = function () {
            AccountPoolCrudService.getPoolStatus($scope.poolId).then(function (result) {
                $scope.poolStatus = result.data;
            });
        };

        $scope.save = function() {
            AccountPoolCrudService.updatePool($scope.poolId, $scope.pool.poolSettings).then(function () {
                $location.path('/pools');
            }, function(error) {
                $log.error('Update pool settings failed. ', error);
            });
        };

        $scope.validate = function (poolForm) {
            if ($scope.pool.poolSettings.minNodes > $scope.pool.poolSettings.maxNodes) {
                poolForm.$setValidity('minmax', false);
            } else {
                poolForm.$setValidity('minmax', true);
            }
        };

        $scope.getPool();
        $scope.getPoolStatus();
    });