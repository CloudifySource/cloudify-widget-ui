'use strict';

var loginTypes = [
    {
        'id': 'google',
        'label': 'Google',
        'size': {
            'width': 100,
            'height': 100
        },
        'data' : {
            'mailchimp' : true
        }
    },
    {
        'id': 'custom',
        'label': 'Custom',
        'size': {
            'width': 100,
            'height': 100
        },
        'data' : {
            'mailchimp' : true
        }
//    },
//    {
//        'id' : 'github',
//        'label' : 'GitHub',
//        'size' : {
//            'width' : 100,
//            'height' : 100
//        },
//        'data' : {
//            'mailchimp' : false
//        }
//    },
//    {
//        'id': 'facebook',
//        'label': 'Facebook',
//        'size': {
//            'width': 100,
//            'height': 100
//        },
//        'data' : {
//            'mailchimp' : true
//        }
//    },
//    {
//        'id': 'twitter',
//        'label': 'Twitter',
//        'size': {
//            'width': 100,
//            'height': 100
//        },
//        'data' : {
//            'mailchimp' : false
//        }
//    },
//    {
//        'id': 'linkedin',
//        'label': 'LinkedIn',
//        'size': {
//            'width': 100,
//            'height': 100
//        },
//        'data' : {
//            'mailchimp' : true
//        }
    }
];


exports.getLoginTypes = function(){
    return loginTypes;
};

exports.getById = function( desiredId ){
    for ( var i = 0; loginTypes.length; i++){
        if ( desiredId === loginTypes[i].id ){
            return loginTypes[i];
        }
    }
};