/**
 * Created by sefi on 9/7/14.
 */

'use strict';

angular.module('cloudifyWidgetUiApp')
    .controller('AdminSystemCtrl', function ($scope, $log, AdminPoolCrudService) {

        $log.debug('getDataSourcesStatus. ');
        AdminPoolCrudService.getDataSourcesStatus().then(function (result) {
            $scope.dsStatus = JSON.stringify( result.data, {}, 4);
        });

    });