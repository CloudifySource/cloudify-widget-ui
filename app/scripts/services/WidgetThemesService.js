'use strict';

angular.module('cloudifyWidgetUiApp')
  .service('WidgetThemesService', function WidgetThemesService() {
        this.themes = [
            {
                'id': 'blank',
                'label': 'Blank',
                'height' : '0',
                'width' : '0'
            },
            {
                'id': 'default',
                'label': 'Default',
                'height' : '463px',
                'width' : '600px'
            },
            {
                'id' : 'softlayer',
                'label' : 'Softlayer',
                'height' : '463px',
                'width' : '600px'
            },
            {
                'id' : 'hp',
                'label' : 'HP Cloud',
                'height' : '463px',
                'width' : '600px'
            }
        ];

        this.getThemeById = function( themeId ){
            for (var i = 0; i < this.themes.length; i++) {
                var obj = this.themes[i];
                if ( obj.id === themeId ){
                    return obj;
                }
            }
            throw new Error('no theme with id [' + themeId + ']');
        };

    });
