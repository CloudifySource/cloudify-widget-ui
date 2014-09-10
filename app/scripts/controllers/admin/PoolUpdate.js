'use strict';

angular.module('cloudifyWidgetUiApp')
  .controller('AdminPoolUpdateCtrl', function ($scope, $routeParams, $log, AdminPoolCrudService) {
        $scope.accountId = $routeParams.accountId;
        $scope.poolId = $routeParams.poolId;


        AdminPoolCrudService.getAccountPool($scope.accountId, $scope.poolId).then(function (result) {
            $scope.pool = result.data;
            // indent the text file to better reading;
            var tempPool = JSON.parse($scope.pool.poolSettingsStr);
            tempPool.bootstrapProperties.script ?
                $scope.pool.bootstrapScript = tempPool.bootstrapProperties.script :
                $scope.pool.bootstrapScript = '';
            tempPool.bootstrapProperties.script = undefined;
            $scope.pool.poolSettingsStr = JSON.stringify( tempPool, {}, 4);
        });

        $scope.updateAccountPool = function( accountId, poolSettingsStr, poolBootstrapScriptStr ){
            var tempPool = JSON.parse(poolSettingsStr);
            if (!tempPool.bootstrapProperties) {
                tempPool.bootstrapProperties = {};
            }
            tempPool.bootstrapProperties.script = poolBootstrapScriptStr || '';
            poolSettingsStr = JSON.stringify(tempPool);

            // update with new data
            AdminPoolCrudService.updateAccountPool($scope.accountId, $scope.pool.id, poolSettingsStr).then(function (/*result*/) {
                toastr.success('updated successfully');
            });
        };

        $scope.getBootstrapScript = function() {
            AdminPoolCrudService.getBootstrapScript().then(
                function success(result) {
                    $scope.pool.bootstrapScript = result.data;
                },
                function error(/*cause*/) {
                    $scope.pool.bootstrapScript = '';
                    $log.error('Retrieve default script failed.');
                }
            );
        };



    });
