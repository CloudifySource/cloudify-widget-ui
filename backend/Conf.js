
// for tests you can add the following line:
// process.env.WIDGET_UI_ME_CONF_JSON = require('path').resolve(__dirname, '../conf/test-conf.json');


var fs = require('fs');
var path = require('path');
var _  = require('lodash');
var meConf = process.env.WIDGET_UI_ME_CONF_JSON || path.resolve('conf/dev/me.json') ;
var prodConf = path.resolve(path.join(__dirname,'..','conf/prod.json') );

var data = fs.readFileSync(prodConf, 'utf8');
if (!!data) {
    _.assign(module.exports, JSON.parse(data));
}
data = fs.readFileSync(meConf, 'utf8');
if (!!data) {
    _.assign(module.exports, JSON.parse(data));
}