'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AdminPoolCrudCtrl', function ($scope, $log, $routeParams, $interval, AdminPoolCrudService) {

        $scope.pingResults = {};

        $scope.getUsers = function () {
            AdminPoolCrudService.getUsers().then(function (result) {
                $scope.model.users = result.data;
            });
        };

        $scope.addUser = function () {
            AdminPoolCrudService.addUser().then(function (/*result*/) {
                $scope.getUsers();
            });
        };

        $scope.getPools = function () {
            AdminPoolCrudService.getPools().then(function (result) {
                $scope.model.pools = result.data;
            });
        };

//        $scope.getAccountPools = function (accountId) {
//            AdminPoolCrudService.getAccountPools(accountId).then(function (result) {
//                $scope.model.accountPools = result.data;
//            });
//        };

        $scope.getAccountPool = function (accountId, poolId) {
            AdminPoolCrudService.getAccountPool(accountId, poolId).then(function (result) {
                $scope.model.singlePool = result.data;
            });
        };

        $scope.getPoolsStatus = function () {
            AdminPoolCrudService.getPoolsStatus().then(function (result) {
                $log.debug('got pools general status ', result.data);
                $scope.model.poolsStatus = result.data;
            });
        };


        $scope.addPoolNode = function (poolId) {
            AdminPoolCrudService.addPoolNode(poolId).then(function (result) {
                $log.debug('machine created, result data is ', result.data);
            });
        };

        $scope.deletePoolNode = function (poolId, nodeId) {
            $log.info('deletePoolNode, poolId: ', poolId, ', nodeId: ', nodeId);
            AdminPoolCrudService.deletePoolNode(poolId, nodeId).then(function (result) {
                $log.debug('machine deleted, result data is ', result.data);
            });
        };

        $scope.bootstrapPoolNode = function (poolId, nodeId) {
            $log.info('bootstrapPoolNode, poolId: ', poolId, ', nodeId: ', nodeId);
            AdminPoolCrudService.bootstrapPoolNode(poolId, nodeId).then(function (result) {
                $log.debug('machine bootstrapped, result data is ', result.data);
            });
        };

        $scope.pingNode = function (poolId, nodeId) {
            $log.debug('Pinging node, poolId: ', poolId, ' nodeId: ', nodeId);
            AdminPoolCrudService.pingNode(poolId, nodeId).then(function (result) {
                $log.debug('machine ping result is ', result.data);
                $scope.pingResults[nodeId] = result.data;
            });
        };

        $scope.deletePoolErrors = function (poolId) {
            $log.debug('deletePoolErrors, poolId: ', poolId);
            AdminPoolCrudService.deletePoolErrors(poolId).then(function (/*result*/) {
                $scope.getPoolErrors(poolId);
                toastr.success('cleared all errors');
            });
        };


        $scope.getCloudNodes = function (poolId) {
            $log.debug('getCloudNodes, poolId: ', poolId);
            $scope.model.poolCloudNodes = 0;
            AdminPoolCrudService.getCloudNodes(poolId).then(function (result) {
                $scope.model.poolCloudNodes = result.data;
            });
        };


        $scope.abortPoolDecision = function (poolId, decisionId) {
            $log.info('abortPoolDecision, poolId: ', poolId, ', decisionId: ', decisionId);
            AdminPoolCrudService.abortPoolDecision(poolId, decisionId).then(function (result) {
                $log.info('decision abort finished, result: ', result);
            });
        };

        $scope.updatePoolDecisionApproval = function (poolId, decision) {
            $log.info('updatePoolDecision, poolId: ', poolId, ', decisionId: ', decision.id);
            AdminPoolCrudService.updatePoolDecisionApproval(poolId, decision).then(
                function (/*result*/) {
                    $log.info('pool decision approval updated, refreshing all decisions');
                    $scope.getPoolDecisions(poolId);
                }, function (err) {
                    $log.error(err);
                });
        };


        $scope.asJson = function (jsonString) {
            return angular.fromJson(jsonString) || '';
        };





    });
