'use strict';

var logger = require('log4js').getLogger('MailchimpService');
var mailchimp = require('mailchimp');
var MailchimpAPI = mailchimp.MailChimpAPI;

function createMailchimpAPI( apiKey ){

    if ( !apiKey ){
        throw new Error('Api key is missing');
    }

    var api;
    try {
        api = new MailchimpAPI(apiKey, { version : '2.0' });
    } catch (err) {
        throw new Error('Unable to initilize MailchimpAPI',err);
    }

    return api;
}

function callListsApi (method, command, callback) {
    logger.info('mailchimp API method', method, ' with command', command);

    callback = typeof(callback) === 'function' && callback || function(){};

    var api = createMailchimpAPI( command.apikey, command.id );

    api.call('lists', method, command, function (error, data) {
        if (!!error) {
            logger.error('unable to ', method, error);
            callback(error);

        } else {
            logger.info('------- ', method, ' successfully completed:');
            logger.info(JSON.stringify(data, null, 2)); // Do something with your data!
            callback(error, data);
        }
    });
}

/**
 * This method allows to associate(subscribe) new member
 * @param command, is JSON, example:
 *
 *
 *      { "apikey" : "Your_api_key",
 *        "id" : "Your_list_id",
 *        "email" :
            {"email": "Your_proper_mail"},
         "merge_vars":{
               "NAME":"Your First name",
               "LASTNAME":"Your Last name"
         }
      }
    Confirma mail will be send and only after confirmation new member will be assiociated/subscribed to provided list
    apiKey - taken from your mailchimp accoun
    id - lits id for new member association
 * @param callback funaction
 */
exports.subscribe = function( command, callback ){
    callListsApi('subscribe', command, callback);
};

exports.list = function(command, callback) {
    callListsApi('list', command, callback);
};
/**
 * This method allows to diassociate(unsubscribe) assiciated member
 * @param command, is JSON, example: { "apikey":"Your_api_key","id":"Your_list_id","email":{"email": "Your_proper_mail" } }
    apiKey - taken from your mailchimp accoun
    id - lits id for new member association
 * @param callback funaction
 */
exports.unsubscribe = function( command, callback ){
    callListsApi('unsubscribe', command, callback);
};

if ( require.main === module ) {
/*
    logger.info('subscribe/add user');
    try{
//        var params =
//            '{ "apikey" : "Your_api_key", "id" : "list_id", "email" : ' +
//            '{"email": "Your_proper_email" }, ' +
//            '"merge_vars":{ "Email Address":"Your_proper_email", "First Name":"Your First name", "Last Name":"Your Last name"} }';

        logger.info('start....');
        var execConfiguration = exports.subscribe( JSON.parse(params), function(){logger.info('subscribing finished...');} );
    }catch(e){
        logger.error('error while adding new user',e);
    }
*/

/*
    logger.info('unsubscribe/remove user');
    try{
//        var params = '{ "apikey" : "Your_api_key", "id" : "list_id", "email": ' +
//            '{"email" : "Your_proper_email"}}';

        var jsonParamsObj = JSON.parse(params);
        logger.info('start....');
        var execConfiguration = exports.unsubscribe( jsonParamsObj,function(){logger.info('unsubscribing finished...');} );
    }catch(e){
        logger.error('error while adding new user',e);
    }
    */
}