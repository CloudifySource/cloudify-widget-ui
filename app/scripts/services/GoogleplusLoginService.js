'use strict';

/**
 * @ngdoc service
 * @name cloudifyWidgetUiApp.GoogleplusLoginService
 * @description
 * # GoogleplusLoginService
 * Service in the cloudifyWidgetUiApp.
 */
angular.module('cloudifyWidgetUiApp')
    .service('GoogleplusLoginService', function () {
        // AngularJS will instantiate a singleton by calling "new" on this function
        this.render = function (onSignin) {
            gapi.signin.render('googleplus', {
                'callback': onSignin,
                'clientid': conf.googleplus.clientId,
                //'requestvisibleactions': Conf.requestvisibleactions,
                'scope': 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/plus.login',
                //'apppackagename': 'your.photohunt.android.package.name',
                'theme': 'dark',
                'cookiepolicy': 'single_host_origin'//,
                //'accesstype': 'offline'
            });
        };
    });
