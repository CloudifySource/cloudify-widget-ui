/**
 * Created by sefi on 05/10/14.
 */
'use strict';
var logger = require('log4js').getLogger('testMailchimpService');

var conf = require('../backend/Conf');
var mailchimpService = require('../backend/services/MailchimpService');

mailchimpService.subscribe(conf.testMailchimp.data, function( err, result ){
    if ( !!err ){
        logger.error(err);
    }else{
        logger.info(result);
    }
});

//mailchimpService.list(conf.testMailchimp.data, function( err, result ){
//    if ( !!err ){
//        logger.error(err);
//    }else{
//        logger.info(result);
//    }
//});
