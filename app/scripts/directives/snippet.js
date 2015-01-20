/**
 * Created by sefi on 09/12/14.
 */
'use strict';
// a directive that allows us to preview the icon.
angular.module('cloudifyWidgetUiApp').directive('snippet', function ($timeout, $compile) {
    return {
        restrict: 'A',
        scope: {
            'deadline': '='
        },
        template: '',
        link: function (scope, $element/*, attributes*/) {

            var textWithIndent = $element.text();

            if ( textWithIndent.indexOf('\n') >= 0 ) {
                textWithIndent = textWithIndent.split('\n');

                var spaceIndex = 0;
                while (textWithIndent[1][spaceIndex] === ' ') {
                    spaceIndex++;
                }

                for (var i = 0; i < textWithIndent.length; i++) {
                    textWithIndent[i] = textWithIndent[i].substring(spaceIndex);
                }
                textWithIndent = textWithIndent.join('\n');
            }

            var newElement = $('<pre class="snippet"></pre>').text( textWithIndent );

            $element.empty().append($compile(newElement)(scope));

        }
    };
});
