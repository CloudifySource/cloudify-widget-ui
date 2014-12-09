/**
 * Created by sefi on 09/12/14.
 */

'use strict';

angular.module('cloudifyWidgetUiApp').controller('DocsIndexCtrl', function ( $scope, $routeParams, $location, $log, WidgetsService ) {
    $scope.docsSections = [
//        {
//            'label' : 'Configuration',
//            'id' : 'configuration'
//        },
        {
            'label' : 'Frontend API',
            'id' : 'frontendApi'
        },
        {
            'label' : 'Backend API',
            'id' : 'backendApi'
        }
    ];


    $scope.domain = $location.host() + ':' + $location.port();
//    WidgetsService.users.getUserDetails().then(function(result){
//        $scope.accountUuid = result.data.session.authToken;
//    }, function(){
//        toastr.info('login to get copy-paste version for commands', 'Not logged in');
//    });


    $scope.messages = [

        {
            'name' : 'Message I Receive',
            'data' :['widget_recipe_properties','widget_play','widget_stop']
        },
        {
            'name' : 'Messages I Post',
            'data' : ['widget_played', 'widget_stopped', 'widget_loaded', 'widget_status']
        }

    ];

    $scope.getMessageIncludeUrl = function(){
        return 'views/documentation/messages/' + $scope.currentMessage + '.html';
    };


    $scope.showMessageDocumentation  = function(message){
        $scope.currentMessage = message;
    };


    function _doNavigation () {
        $scope.currentSection = _.find($scope.docsSections, {'id': $routeParams.section });
    }
    $scope.$watch( function(){ return $routeParams.section; },  _doNavigation );


    $scope.showSection = function(section){
        $location.search('section', section.id);

    };


    if ( !$routeParams.section ){
        $scope.showSection($scope.docsSections[0]);
    }else{
        _doNavigation();
    }

    $scope.isCurrentSection = function( section ){
        $log.info('is current section');
        return $routeParams.section === section.id;
    };

    $scope.configuration ={ 'children' :  [
        {
            name : 'server',
            children : [
                {
                    name : 'bootstrap',
                    children : [
                        {
                            'name' : 'createServerRetries',
                            'description' : 'The number of times to retry',
                            'type' : 'number',
                            'example' : 5
                        }
                    ]
                }
            ]

        }
    ] };

});
