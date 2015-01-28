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
    })
    .value('PollingConstants', {
        POOL_VIEW: 'poolViewAggregatePolling',
        POOL_VIEW_STATUS: 'poolStatusPolling',
        POOL_VIEW_NODES: 'poolNodesPolling',
        POOL_VIEW_TASKS: 'poolTasksPolling',
        POOL_VIEW_ERRORS: 'poolErrorsPoling',
        POOL_VIEW_DECISIONS: 'poolDecisionsPolling',
        POOL_VIEW_THREADPOOL: 'poolThreadpoolStatusPolling',
        POOL_VIEW_NODE_MAPPINGS: 'poolNodeMappingsPolling'
    });
