'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AdminPoolsCreateCtrl', function ($scope, $routeParams, $log, AdminPoolCrudService, $location) {

        $scope.accountId = $routeParams.accountId;
        $scope.bootstrapScript = {
            value: ''
        };

        $scope.addAccountPool = function (accountId, poolSettings, bootstrapScript) {
            var tempPool = JSON.parse(poolSettings);
            if (!tempPool.bootstrapProperties) {
                tempPool.bootstrapProperties = {};
            }
            tempPool.bootstrapProperties.script = bootstrapScript || '';
            poolSettings = JSON.stringify(tempPool);

            AdminPoolCrudService.addAccountPool(accountId, poolSettings).then(function (/*result*/) {
                $location.path('/admin/accounts/' + accountId + '/pools');
            });
        };

        $scope.getBootstrapScript = function() {
            AdminPoolCrudService.getBootstrapScript().then(
                function success(result) {
                    $scope.bootstrapScript.value = result.data;
                },
                function error(/*cause*/) {
                    $scope.bootstrapScript.value = '';
                    $log.error('Retrieve default script failed.');
                }
            );
        };
    });
