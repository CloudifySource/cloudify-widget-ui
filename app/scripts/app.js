'use strict';

angular.module('cloudifyWidgetUiApp', ['ngCookies', 'ngRoute', 'ngStorage', 'ngResource', 'ngSanitize', 'ui.bootstrap', 'angular-lodash', 'gsUiInfraApp'])
// register the interceptor as a service
    .factory('myHttpInterceptor', function ($q, $rootScope, $location) {
        var $scope = $rootScope;
        return {
            // optional method
            'request': function (config) {
                $scope.pageError = null;
                $scope.ajaxRequestInProgress = true;
                // do something on success
                return config || $q.when(config);
            },

            // optional method
            'requestError': function (rejection) {
                if (rejection.hasOwnProperty('data') && rejection.data.hasOwnProperty('message')) {
                    $scope.pageError = rejection.data.message;
                }
                $scope.ajaxRequestInProgress = false;
                // do something on error

                return $q.reject(rejection);
            },


            // optional method
            'response': function (response) {

                if (response.status === 401) {
                    $location.path('/login');
                } else if (response.status === 500 && response.data.hasOwnProperty('message')) {
                    $scope.pageError = response.data.message;
                }

                $scope.ajaxRequestInProgress = false;
                // do something on success
                return response || $q.when(response);
            },

            // optional method
            'responseError': function (rejection) {
                if (rejection.hasOwnProperty('data') && rejection.data.hasOwnProperty('message')) {
                    $scope.pageError = rejection.data.message;
                }
                $scope.ajaxRequestInProgress = false;
                return $q.reject(rejection);
            }
        };
    })
    .config(function ($routeProvider, $httpProvider, $logProvider) {
        $routeProvider
            .when('/demo', {
                templateUrl: 'views/demo.html',
                controller: 'DemoCtrl'
            })
            .when('/natidemo', {
                templateUrl: 'views/natiDemo.html',
                controller: 'NatiDemoCtrl'
            })
            .when('/dashboard', {
                templateUrl: 'views/dashboard.html',
                controller: 'DashboardCtrl'
            })
            .when('/signup', {
                templateUrl: 'views/signup.html',
                controller: 'SignupCtrl'
            })
//            .when('/:role/pools', {
//                templateUrl: 'views/pools.html',
//                controller: 'PoolsIndexCtrl'
//            })
            .when('/pools', {
                templateUrl: 'views/pools/accountPools.html',
                controller: 'AccountPoolCtrl'
            })
            .when('/pools/create', {
                templateUrl: 'views/pools/accountPoolCreate.html',
                controller: 'AccountPoolCrudCtrl',
                reloadOnSearch: false
            })
            .when('/pools/:poolId', {
                templateUrl: 'views/pools/accountPool.html',
                controller: 'AccountPoolCrudCtrl'
            })
            .when('/pools/:poolId/edit', {
                templateUrl: 'views/pools/accountPoolEdit.html',
                controller: 'AccountPoolCrudCtrl',
                reloadOnSearch: false
            })

            .when('/admin/users', {
                templateUrl: 'views/admin/users.html',
                controller: 'AdminUsersIndexCtrl'
//                controller: 'AdminPoolCrudCtrl'
            })
            .when('/admin/myUser', {
                templateUrl: 'views/admin/myUser.html',
                controller: 'AdminMyUserCtrl'
            })
            .when('/admin/system', {
                templateUrl: 'views/admin/system.html',
                controller: 'AdminSystemCtrl'
            })
            .when('/admin/users/:userId/edit', {
                templateUrl: 'views/admin/users/edit.html',
                controller: 'AdminUsersEditCtrl'
            })
            .when('/admin/pools/status', {
                templateUrl: 'views/admin/poolsStatus.html',
                controller: 'AdminPoolCrudCtrl'
            })
            .when('/admin/pools/:poolId/status', {
                templateUrl: 'views/admin/poolStatus.html',
                controller: 'AdminPoolCrudCtrl'
            })
            .when('/admin/accounts/:accountId/pools/:poolId/update', {
                templateUrl : 'views/admin/updateUserPool.html',
                controller: 'AdminPoolUpdateCtrl'
            })
            .when('/admin/pools/:poolId/nodes', {
                templateUrl: 'views/admin/poolNodes.html',
                controller: 'AdminPoolCrudCtrl'
            })
            .when('/admin/pools/:poolId/tasks', {
                templateUrl: 'views/admin/poolTasks.html',
                controller: 'AdminPoolCrudCtrl'
            })
            .when('/admin/pools/:poolId/errors', {
                templateUrl: 'views/admin/poolErrors.html',
                controller: 'AdminPoolCrudCtrl'
            })
            .when('/admin/pools/:poolId/cloud/nodes', {
                templateUrl: 'views/admin/poolCloudNodes.html',
                controller: 'AdminPoolCrudCtrl'
            })
            .when('/admin/pools/:poolId/decisions', {
                templateUrl: 'views/admin/poolDecisions.html',
                controller: 'AdminPoolCrudCtrl'
            })

            .when('/admin/accounts/:accountId/pools', {
                templateUrl: 'views/admin/userPools.html',
                controller: 'AdminUserPoolsCtrl'
            })
            .when('/admin/accounts/:accountId/pools/create', {
                templateUrl: 'views/admin/createUserPool.html',
                controller: 'AdminPoolsCreateCtrl'
            })

            .when('/widgets', {
                templateUrl: 'views/dashboard.html',
                controller: 'DashboardCtrl'
            })
            .when('/widgets/:widgetId/read', {
                templateUrl: 'views/widget/read.html',
                controller: 'AdminWidgetReadCtrl'
            })
            .when('/widgets/:widgetId/login/index', {
                templateUrl: 'views/widget/login/index.html',
                controller: 'WidgetLoginCtrl'
            })

            .when('/widgets/:widgetId/update', {
                templateUrl: 'views/widget/update.html',
                controller: 'WidgetCrudCtrl',
                reloadOnSearch: false

            })
            .when('/widgets/create', {
                templateUrl: 'views/widget/create.html',
                controller: 'WidgetCrudCtrl',
                reloadOnSearch: false
            })
            .when('/widgets/:widgetId/view', {
                templateUrl: 'views/widget/themes/widgetView.html',
                controller: 'WidgetViewCtrl'
            })
            .when('/widgets/:widgetId/embed', {
                templateUrl: 'views/widget/themes/widgetEmbed.html',
                controller: 'WidgetEmbedCtrl'
            })
            .when('/widgets/:widgetId/blank', {
                templateUrl: 'views/widget/themes/blank.html',
                controller: 'WidgetCtrl'
            })

            .when('/admin/accounts/:accountId/pools/:poolId/combinedView', {
                templateUrl: 'views/pools/combinedStatusView.html',
                controller: 'AdminPoolViewCtrl'
            })
            .when('/widgets/:widgetId/login/custom', {
                templateUrl: 'views/widget/login/custom.html',
                controller: 'CustomLoginCtrl'
            })
            .when('/login', {
                templateUrl: 'views/login.html',
                controller: 'LoginCtrl'
            })
            .when('/documentation', {
                templateUrl: 'views/documentation/index.html',
                controller: 'DocsIndexCtrl'
            })
            .when('/embed-demo', {
                templateUrl: 'views/embed-demo.html',
                controller: 'EmbedDemoCtrl'
            })
            .otherwise({
                redirectTo: '/login'
            });

        $httpProvider.interceptors.push('myHttpInterceptor');

        $logProvider.debugEnabled(false);
    })
    .run(function(I18next, $rootScope) {
        $rootScope.$watch('currentLanguage', function(newVal/*, oldVal*/) {
            I18next.setOptions({lng: newVal});
        });

        $rootScope.currentLanguage = 'en';
    });
