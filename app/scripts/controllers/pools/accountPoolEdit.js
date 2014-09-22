/**
 * Created by sefi on 9/21/14.
 */

'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AccountPoolEditCtrl', function ($scope, AccountPoolCrudService, $routeParams, $location, $log) {
        $scope.name = 'pools page';
        $scope.poolId = $routeParams.poolId;

        $scope.getPool = function () {
            AccountPoolCrudService.getPool($scope.poolId).then(function (result) {
                $scope.pool = result.data;
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

    });