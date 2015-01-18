/**
 * Created by sefi on 9/21/14.
 */

'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AccountPoolCrudCtrl', function ($scope, AccountPoolCrudService, $routeParams, $location, $log) {
        $scope.name = 'pools page';
        $scope.poolId = $routeParams.poolId;

        $scope.getPool = function () {
            if (angular.isDefined($scope.poolId)) {
                AccountPoolCrudService.getPool($scope.poolId).then(function (result) {
                    $scope.pool = result.data;
                });
            } else {
                $scope.pool = {
                    'poolSettings': {
                        'name': null,
                        'authKey': '---key---',
                        'maxNodes': 5,
                        'minNodes': 2,
                        'nodeManagement': {
                            'mode': 'MANUAL_APPROVAL',
                            'activeModules': [
                                'CREATE',
                                'BOOTSTRAP',
                                'DELETE',
                                'DELETE_EXPIRED'
                            ],
                            'emailSettings': null,
                            'pingSettings': null
                        },
                        'bootstrapProperties': {
                            'publicIp': '',
                            'privateIp': '',
                            'cloudifyUrl': 'http://repository.cloudifysource.org/org/cloudifysource/community/gigaspaces-cloudify-2.7.0-ga-b5996.zip',
                            'preBootstrapScript': '',
                            'recipeUrl': '',
                            'recipeRelativePath': ''
                        },
                        'provider': {
                            'name': 'softlayer',
                            'connectDetails': {
                                'username': null,
                                'key': null,
                                'networkId': '24713'
                            },
                            'machineOptions': {
                                'mask': 'softlayer-pool-prefix',
                                'machinesCount': 1,
                                'osFamily': 'CENTOS',
                                'locationId': '352494',
                                'hardwareId': '860,1155,3876,188,439'
                            }
                        }
                    }
                };
            }
        };

        $scope.getPoolStatus = function () {
            if (angular.isDefined($scope.poolId)) {
                AccountPoolCrudService.getPoolStatus($scope.poolId).then(function (result) {
                    $scope.poolStatus = result.data;
                });
            }
        };

        $scope.createPool = function () {
            AccountPoolCrudService.createPool($scope.pool.poolSettings).then(function (/*result*/) {
                $location.path('/pools/');
            }, function(error) {
                $log.error('Update pool settings failed. ', error);
            });
        };

        $scope.updatePool = function() {
            AccountPoolCrudService.updatePool($scope.poolId, $scope.pool.poolSettings).then(function () {
                $location.path('/pools/');
            }, function(error) {
                $log.error('Update pool settings failed. ', error);
            });
        };

        $scope.getPool();
        $scope.getPoolStatus();
    });