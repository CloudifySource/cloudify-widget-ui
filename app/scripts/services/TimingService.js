/**
 * Created by sefi on 21/01/15.
 */

'use strict';

angular.module('cloudifyWidgetUiApp')
    .factory('TimingSrv', function ($interval) {
        var registrants = {},
            internalInterval = 1000;

        var start = function () {
            $interval(service.tick, internalInterval);
            service.tick();
        };

        var service = {
            register: function (id, tickHandler, interval, delay) {
                if (!interval) {
                    interval = 1000;
                }

                if (!delay) {
                    delay = 0;
                }

                registrants[id] = {
                    tick: tickHandler,        // tick handler function.
                    interval: interval,       // configured interval.
                    delay: delay              // delay until first tick.
                };
            },

            unregister: function (id) {
                delete registrants[id];
            },

            tick: function () {
                angular.forEach(registrants, function (registrant) {
                    // update the delay.
                    registrant.delay -= internalInterval;

                    if (registrant.delay <= 0) {
                        // time to tick!
                        registrant.tick();

                        //reset delay to configured interval
                        registrant.delay = registrant.interval;
                    }
                });
            }
        };

        start();

        return service;
    });
