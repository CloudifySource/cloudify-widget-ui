'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AdminPoolViewCtrl', function ($scope, $log, AdminPoolCrudService, $routeParams, $location, $interval) {

        $scope.accountId = $routeParams.accountId;
        $scope.poolId = $routeParams.poolId;

        $scope.predicate = 'id';
        $scope.reverse = true;

        var cloudNodesRefreshInterval = 360;

        $scope.model = {
            accountId: $routeParams.accountId,
            poolId: $routeParams.poolId,
            newPoolSettings: '',
            accountPools: [],
            pools: [],
            users: [],
            poolStatus: {},
            poolsStatus: {},
            nodes: [],
            threadPoolStatus: []
        };


        var refreshInterval = $interval(function () {
            // TODO create child controllers and separate behaviors so we wouldn't have to call every getter
            $log.info('refreshing');

//            if (!$rootScope.autoRefresh) {
//                return;
//            }

//            $scope.getUsers();
//            $scope.getPools();

            if (angular.isDefined($scope.model.poolId)) {
                $scope.getPoolStatus($scope.model.poolId);
                $scope.getPoolNodes($scope.model.poolId);
                $scope.getPoolTasks($scope.model.poolId);
                $scope.getPoolErrors($scope.model.poolId);
                $scope.getPoolDecisions($scope.model.poolId);
                $scope.getThreadPoolStatus($scope.model.poolId);

                cloudNodesRefreshInterval--;
                if (cloudNodesRefreshInterval <= 0) {
                    // this will only get polled once every 360*5s (30 min).
                    $scope.getCloudNodes($scope.model.poolId);
                    cloudNodesRefreshInterval = 360;
                }
            }
//            if (angular.isDefined($scope.model.accountId)) {
//                $scope.getAccountPools($scope.model.accountId);
//            }
//            if (angular.isDefined($scope.model.accountId) && angular.isDefined($scope.model.poolId)) {
//                $scope.getAccountPool($scope.model.accountId, $scope.model.poolId);
//            }
        }, 5000);

        $scope.$on('$destroy', function () {
            $interval.cancel(refreshInterval);
        });

        $scope.getPoolStatus = function (poolId) {
            AdminPoolCrudService.getPoolStatus(poolId).then(function (result) {
                $log.debug('got pool detailed status ', result.data);
                $scope.model.poolStatus = result.data;
            });
        };


        $scope.getPoolNodes = function (poolId) {
            AdminPoolCrudService.getPoolNodes(poolId).then(function (result) {
                $log.debug('got machines, result data is ', result.data);
                $scope.model.nodes = result.data;
            });
        };

        $scope.getCloudNodes = function (poolId) {
            AdminPoolCrudService.getCloudNodes(poolId).then(function(result) {
                $log.debug('got all cloud nodes, result data is ', result.data);
                $scope.model.poolCloudNodes = result.data;
            });
        };

        $scope.getPoolTasks = function (poolId) {
            $log.debug('getPoolTasks, poolId: ', poolId);
            AdminPoolCrudService.getPoolTasks(poolId).then(function (result) {
                $scope.model.poolTasks = result.data;
            });
        };


        $scope.getPoolDecisions = function (poolId) {
            $log.debug('getPoolDecisions, poolId: ', poolId);
            AdminPoolCrudService.getPoolDecisions(poolId).then(function (result) {
                $scope.model.poolDecisions = result.data;
            });
        };

        $scope.getThreadPoolStatus = function () {
            $log.debug('getThreadPoolStatus. ');
            AdminPoolCrudService.getThreadPoolStatus().then(function (result) {
                $scope.model.threadPoolStatus = JSON.stringify( result.data, {}, 4);
            });
        };

        $scope.deleteAccountPool = function (accountId, poolId) {
            $log.info('deleteAccountPool, accountId: ', accountId, ', poolId: ', poolId);
            if (!!confirm('are you sure you want to delete this pool?')) {
                AdminPoolCrudService.deleteAccountPool(accountId, poolId).then(function (/*result*/) {
                    $location.path('/admin/accounts/' + accountId + '/pools');

                });
            }
        };


        $scope.getPoolErrors = function (poolId) {
            $log.debug('getPoolErrors, poolId: ', poolId);
            AdminPoolCrudService.getPoolErrors(poolId).then(function (result) {
                $scope.model.poolErrors = result.data;
            });
        };


        $scope.cleanAccountPool = function (accountId, poolId) {
            $log.info('cleanAccountPool, accountId: ', accountId, ', poolId: ', poolId);
            AdminPoolCrudService.cleanAccountPool(accountId, poolId).then(function (/*result*/) {
                $log.debug('clean pool initiated successfully');
                toastr.info('pool clean request dispatched successfully');
            });
        };

    });
