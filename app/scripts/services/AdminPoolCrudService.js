'use strict';

angular.module('cloudifyWidgetUiApp')
    .factory('AdminPoolCrudService', function ($http) {

        function AdminPoolCrudService() {

            this.getPools = function () {
                return $http.get('/backend/admin/pools');
            };

            this.getBootstrapScript = function () {
                return $http.get('/backend/admin/pools/script');
            };

            this.getUsers = function () {
                return $http.get('/backend/admin/users');
            };

            this.addUser = function () {
                return $http.post('/backend/admin/users');
            };

            this.getAccountPools = function (accountId) {
                if ( !accountId ){
                    throw new Error('accountId is missing');
                }
                return $http.get('/backend/admin/accounts/' + accountId + '/pools');
            };

            this.getAccountPool = function (accountId, poolId) {
                if ( !accountId ){
                    throw new Error('accountId is missing');
                }
                return $http.get('/backend/admin/accounts/' + accountId + '/pools/' + poolId);
            };

            this.addAccountPool = function (accountId, poolSettings) {
                if ( !accountId ){
                    throw new Error('accountId is missing');
                }
                return $http.post('/backend/admin/accounts/' + accountId + '/pools', poolSettings);
            };

            this.updateAccountPool = function (accountId, poolId, poolSettings) {
                if ( !accountId ){
                    throw new Error('accountId is missing');
                }
                return $http.post('/backend/admin/accounts/' + accountId + '/pools/' + poolId, poolSettings);
            };

            this.deleteAccountPool = function (accountId, poolId) {
                if ( !accountId ){
                    throw new Error('accountId is missing');
                }
                return $http.post('/backend/admin/accounts/' + accountId + '/pools/' + poolId + '/delete');
            };

            this.cleanAccountPool = function (accountId, poolId) {
                if ( !accountId ){
                    throw new Error('accountId is missing');
                }
                return $http.post('/backend/admin/accounts/' + accountId + '/pools/' + poolId + '/clean');
            };

            this.getPoolStatus = function (poolId) {
                return $http.get('/backend/admin/pools/' + poolId + '/status');
            };

            this.getPoolsStatus = function () {
                return $http.get('/backend/admin/pools/status');
            };

            this.getPoolNodes = function (poolId) {
                return $http.get('/backend/admin/pools/' + poolId + '/nodes');
            };

            this.addPoolNode = function (poolId) {
                return $http.post('/backend/admin/pools/' + poolId + '/nodes');
            };

            this.deletePoolNode = function (poolId, nodeId) {
                return $http.post('/backend/admin/pools/' + poolId + '/nodes/' + nodeId + '/delete');
            };

            this.deleteCloudNode = function (poolId, machineId) {
                return $http.post('/backend/admin/pools/' + poolId + '/cloud/nodes/' + machineId + '/delete');
            };

            this.bootstrapPoolNode = function (poolId, nodeId) {
                return $http.post('/backend/admin/pools/' + poolId + '/nodes/' + nodeId + '/bootstrap');
            };

            this.pingNode = function (poolId, nodeId) {
                return $http.post('/backend/admin/pools/' + poolId + '/nodes/' + nodeId + '/ping');
            };

            this.deletePoolErrors = function (poolId) {
                return $http.post('/backend/admin/pools/' + poolId + '/errors/delete');
            };

            this.getPoolErrors = function (poolId) {
                return $http.get('/backend/admin/pools/' + poolId + '/errors');
            };

            this.getPoolTasks = function (poolId) {
                return $http.get('/backend/admin/pools/' + poolId + '/tasks');
            };

            this.getCloudNodes = function (poolId) {
                return $http.get('/backend/admin/pools/' + poolId + '/cloud/nodes');
            };

            this.getPoolDecisions = function (poolId) {
                return $http.get('/backend/admin/pools/' + poolId + '/decisions');
            };

            this.getThreadPoolStatus = function () {
                return $http.get('/backend/admin/threadpools');
            };

            this.getDataSourcesStatus = function () {
                return $http.get('/backend/admin/datasources');
            };

            this.abortPoolDecision = function (poolId, decisionId) {
                return $http.post('/backend/admin/pools/' + poolId + '/decisions/' + decisionId + '/abort');
            };

            this.updatePoolDecisionApproval = function (poolId, decision) {
                return $http.post('/backend/admin/pools/' + poolId + '/decisions/' + decision.id + '/approved/' + decision.approved);
            };

        }

        return new AdminPoolCrudService();
    });