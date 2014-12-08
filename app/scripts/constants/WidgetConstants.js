/**
 * Created by sefi on 7/21/14.
 */

'use strict';

angular.module('cloudifyWidgetUiApp')
    .value('WidgetConstants', {
        PLAY: 'widget_play',
        STOP: 'widget_stop',
        PARENT_LOADED: 'parent_loaded',
        STATUS: 'widget_status',
        PLAYED: 'widget_played',
        STOPPED: 'widget_stopped',
        RECIPE_PROPERTIES: 'widget_recipe_properties'
    })
    .value('PoolConstants', {
        APPROVAL: [
            'MANUAL_APPROVAL', 'AUTO_APPROVAL'
        ]
    });