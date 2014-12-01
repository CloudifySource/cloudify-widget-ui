'use strict';
var recipeTypes = [
    {
        'label': 'Application',
        'id': 'application',
        'installCommand': 'install-application'
    },
    {
        'label': 'Service',
        'id': 'service',
        'installCommand': 'install-service'
    }
];


exports.get = function(){
    return recipeTypes;
};

exports.getById = function( id ){
    for ( var i = 0; i < recipeTypes.length; i++){
        if ( recipeTypes[i].id === id ){
            return recipeTypes[i];
        }
    }
    return null;
};