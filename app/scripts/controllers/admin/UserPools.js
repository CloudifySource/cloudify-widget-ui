'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AdminUserPoolsCtrl', function ($scope, AdminPoolCrudService, $routeParams) {

        $scope.accountId = $routeParams.accountId;

        $scope.getAccountPools = function (accountId) {
            AdminPoolCrudService.getAccountPools(accountId).then(function (result) {
                $scope.pools = result.data;
            });
        };

        $scope.getAccountPools($scope.accountId);
    });
