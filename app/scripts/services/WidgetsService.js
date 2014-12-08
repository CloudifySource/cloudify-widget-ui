'use strict';

angular.module('cloudifyWidgetUiApp')
    .service('WidgetsService', function WidgetsService($http, $log) {
        this.deleteWidget = function (widget) {
            if (!confirm('are you sure you want to delete ' + widget.title)) {
                return;
            }
            return $http.post('/backend/user/widgets/' + widget._id + '/delete');
        };

        this.listWidgets = function () {
            return $http.get('/backend/user/widgets');
        };

        this.listPools = function () {

            return $http.get('/backend/user/account/pools');    // todo: this is a duplicate. see AccountPoolCrudService
        };

        this.getPublicWidget = function (widgetId) {
            if ( !widgetId ){
                throw new Error('widgetId is missing');
            }
            return $http.get('/backend/widgets/' + widgetId);
        };

        this.getWidget = function (widgetId) {
            if ( !widgetId ){
                throw new Error('missing widgetId');
            }
            return $http.get('/backend/user/widgets/' + widgetId);
        };

        this.createWidget = function (widget) {
            return $http.post('/backend/user/widgets', widget);
        };

        this.updateWidget = function (widget) {
            return $http.post('/backend/user/widgets/' + widget._id + '/update', widget);
        };

        this.playWidget = function (widget, loginDetailsId, executionDetails) {
            $log.info('playing widget');
            return $http.post('/backend/widgets/' + widget._id + '/play', {executionDetails: executionDetails, loginDetailsId: loginDetailsId});
        };

        this.stopWidget = function (widget, executionId) {
            return $http.post('/backend/widgets/' + widget._id + '/executions/' + executionId + '/stop');
        };

        this.getStatus = function (widgetId, executionId) {
            return $http.get('/backend/widgets/' + widgetId + '/executions/' + executionId + '/status');
        };

        this.getOutput = function (widget, executionId) {
            return $http.get('/backend/user/widgets/' + widget._id + '/executions/' + executionId + '/output');
        };

        this.tryPrivateImagesNow = function(isAdd, accountId, images) {
            var data = {
                action: isAdd ? 'add' : 'remove',
                accountId: accountId,
                images: images
            };

            return $http.post('/backend/widgets/images/try', data);
        };
    });
