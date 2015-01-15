'use strict';

/**
 * @ngdoc directive
 * @name cloudifyWidgetUiApp.directive:poolError
 * @description
 * # poolError
 */
angular.module('cloudifyWidgetUiApp')
    .directive('poolError', function ($log) {
        return {
            template: ' <pre>{{ data }}</pre>',
            restrict: 'A',
            scope: {
                'dataObj': '=poolError'
            },
            link: function postLink(scope) {
                scope.$watch('dataObj', function (newValue, oldValue) {
                    $log.info('poolerror changed', newValue, oldValue);
                    if (!!newValue) {

                        var infoObj = newValue.info;
                        try {
                            infoObj = JSON.parse(infoObj);
                        } catch (e) {

                        }

                        if (infoObj.hasOwnProperty('stackTrace')) {
                            if (typeof(infoObj.stackTrace ) === 'string') {
                                infoObj = infoObj.stackTrace;
                            } else { // object
                                try {
                                    infoObj = _.map(infoObj.stackTrace, function (item) {
                                        return item.className + '#' + item.methodName + ' [' + item.fileName + '] ' + item.lineNumber;
                                    });
                                    infoObj = infoObj.join('\n');
                                } catch (e) {

                                }
                            }

                        }
                        scope.data = infoObj;
                    }
                });

            }
        };
    });
