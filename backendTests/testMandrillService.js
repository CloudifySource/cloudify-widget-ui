
var logger = require('log4js').getLogger('testMandrillService');

var conf = require('../backend/Conf');
var mandrillService = require('../backend/services/MandrillService');

mandrillService.sendMandrillTemplate(conf.testMandrill.data, function( err, result ){
    if ( !!err ){
        logger.error(err);
    }else{
        logger.info(result);
    }
});
