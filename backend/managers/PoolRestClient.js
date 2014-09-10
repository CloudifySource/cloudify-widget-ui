'use strict';
var logger = require('log4js').getLogger('PoolRestClient');
var conf = require('../Conf');
var _ = require('lodash');

// var ajax = require('http');
var Client = require('node-rest-client').Client;
var client = new Client();

function _getBaseUrl() {
    return conf.poolRestUrl.protocol + '://' + conf.poolRestUrl.domain + ':' + conf.poolRestUrl.port;
}

function _url(relativePath) {
    var result = _getBaseUrl() + relativePath;
    logger.debug('calling [%s]', result);
    return result;
}


function ArgsBuilder() {

    var _args = {  };

    this.header = function (_header) {
        _.merge(_args, {'headers': _header });
        return this;
    };

    this.path = function (_path) {
        _.merge(_args, {'path': _path});
        return this;
    };

    this.data = function (_data) {
        _.merge(_args, {'data': _data});
        return this;
    };

    this.param = function (_param) {
        _.merge(_args, {'parameters': _param});
    };

    this.done = function () {
        return _args;
    };


    this.poolKey = function (_poolKey) {
        this.header({'AccountUuid': _poolKey });
        return this;
    };

    this.accountId = function (_accountId) {
        this.path({'accountId': _accountId});
        return this;
    };

    this.poolId = function (_poolId) {
        this.path({'poolId': _poolId });
        return this;
    };

    this.nodeId = function (_nodeId) {
        this.path({'nodeId': _nodeId});
        return this;
    };

    this.taskId = function (_taskId) {
        this.path({'taskId': _taskId});
        return this;
    };

    this.decisionId = function (_decisionId) {
        this.path({'decisionId': _decisionId});
        return this;
    };

    this.approved = function (_approved) {
        this.path({'approved': _approved});
        return this;
    };

    this.widgetId = function (_widgetId) {
        this.path({'widgetId': _widgetId});
        return this;
    };

    this.cloudId = function (_cloudId) {
        this.path({'cloudId': _cloudId});
        return this;
    };
}


var _args = function () {
    return new ArgsBuilder();
};

function responseError(response, data) {
    var err = new Error();
    err.response = response;
    if (typeof(data) === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
        }
    }
    err.data = data;
    return err;
}

function Call() {

    function _callbackWrapper(callback) {
        return function (data, response) {
            if (response.statusCode === 200) {
                if ( typeof(data) === 'string'){
                    try {
                        data = JSON.parse( data );
                    }catch(e){
                        logger.error('unable to parse JSON',data);
                    }
                }
                callback(null, data);
            } else {
                logger.info('got an error from rest client', response.statusCode);
                callback(responseError(response, data));
            }
        };
    }

    this.invoke = function (method, url, args, callback) {
        var myArgs = args;
        if (args instanceof ArgsBuilder) {
            myArgs = args.done();
        }
        logger.info('POST: ', url);
        var myUrl = _url(url);
        var myCallback = _callbackWrapper(callback);
        try {
            var req;
            if (method === 'get') {
                req = client.get(myUrl, myArgs, myCallback);
            } else if (method === 'post') {
                req = client.post(myUrl, myArgs, myCallback);
            }
            req.on('error', function (e) {
                logger.error('got request error', arguments);
                callback(e);
            });
        } catch (e) {
            logger.error('got error from client', e);
            callback(e);
        }
    };

    this.post = function (url, args, callback) {
        this.invoke('post', url, args, callback);
    };

    this.get = function (url, args, callback) {
        this.invoke('get', url, args, callback);
    };

}

var call = new Call();




/**************** ADMIN LEVEL CALLS ***************************/


exports.createAccount = function (poolKey, callback) {
    logger.info('creating account');
    call.post('/admin/accounts', _args().poolKey(poolKey), callback);
};

exports.readAccounts = function (poolKey, callback) {
    logger.info('get accounts called on pool rest client');
    call.get('/admin/accounts', _args().poolKey(poolKey), callback);
};

exports.adminReadPools = function (poolKey, callback) {
    logger.info('reading all pools');
    call.get('/admin/pools', _args().poolKey(poolKey), callback);
};

exports.adminReadPoolBootstrapScript = function (poolKey, callback) {
    logger.info('reading pool default bootstrarp script');
    call.get('/admin/pools/script', _args().poolKey(poolKey), callback);
};

exports.adminReadAccountPools = function (poolKey, accountId, callback) {
    logger.info('getting all pools for account : ' + accountId);
    call.get('/admin/accounts/${accountId}/pools', _args().poolKey(poolKey).accountId(accountId), callback);
};

exports.readByUuid = function( poolKey, uuid, callback ){
    logger.info('getting account by uuid : ' + uuid);
    call.get('/admin/accounts/byUuid/' + uuid, _args().poolKey(poolKey).path( { 'uuid' : uuid } ), callback);
};

exports.setAccountDescription = function ( poolKey, accountId, description, callback ){
    logger.info('setting description to account : ' + accountId );
    call.post('/admin/accounts/${accountId}/description', _args().poolKey(poolKey).accountId(accountId).data(description), callback);
};

exports.createAccountPool = function (poolKey, accountId, poolSettings, callback) {
    logger.info('creating new pool for account ::' + accountId);
    call.post('/admin/accounts/${accountId}/pools', _args().poolKey(poolKey).accountId(accountId).data(poolSettings), callback);
};

exports.updateAccountPool = function (poolKey, accountId, poolId, poolSettings, callback) {
    logger.info('updating pool, account [%s] pool [%s] ', accountId, poolId);
    call.post('/admin/accounts/${accountId}/pools/${poolId}', _args().poolKey(poolKey).accountId(accountId).poolId(poolId).data(poolSettings), callback);
};

exports.deleteAccountPool = function (poolKey, accountId, poolId, callback) {
    logger.info('deleting pool, account [%s] pool [%s]', accountId, poolId);
    call.post('/admin/accounts/${accountId}/pools/${poolId}/delete', _args().poolKey(poolKey).accountId(accountId).poolId(poolId), callback);
};

exports.cleanAccountPool = function (poolKey, accountId, poolId, callback) {
    logger.info('cleaning pool, account [%s] pool [%s]', accountId, poolId);
    call.post('/admin/accounts/${accountId}/pools/${poolId}/clean', _args().poolKey(poolKey).accountId(accountId).poolId(poolId), callback);
};

exports.readAccountPool = function (poolKey, accountId, poolId, callback) {
    logger.info('reading pool, account [%s] pool [%s]', accountId, poolId);
    call.get('/admin/accounts/${accountId}/pools/${poolId}', _args().poolKey(poolKey).accountId(accountId).poolId(poolId), callback);
};

// detailed status
exports.readPoolStatus = function (poolKey, poolId, callback) {
    logger.info('reading detailed pool status [%s]', poolId);
    call.get('/admin/pools/${poolId}/status', _args().poolKey(poolKey).poolId(poolId), callback);
};
// general status
exports.readPoolsStatus = function (poolKey, callback) {
    logger.info('reading general pool status');
    call.get('/admin/pools/status', _args().poolKey(poolKey), callback);
};

exports.readPoolNodes = function (poolKey, poolId, callback) {
    logger.info('reading pool machines [%s]', poolId);
    call.get('/admin/pools/${poolId}/nodes', _args().poolKey(poolKey).poolId(poolId), callback);
};
exports.createPoolNode = function (poolKey, poolId, callback) {
    logger.info('adding machine to pool');
    call.post('/admin/pools/${poolId}/nodes', _args().poolKey(poolKey).poolId(poolId), callback);
};
exports.deletePoolNode = function (poolKey, poolId, nodeId, callback) {
    logger.info('deleting machine from pool');
    call.post('/admin/pools/${poolId}/nodes/${nodeId}/delete', _args().poolKey(poolKey).poolId(poolId).nodeId(nodeId), callback);
};
exports.bootstrapPoolNode = function (poolKey, poolId, nodeId, callback) {
    logger.info('bootstrapping machine');
    call.post('/admin/pools/${poolId}/nodes/${nodeId}/bootstrap', _args().poolKey(poolKey).poolId(poolId).nodeId(nodeId), callback);
};
exports.pingNode = function (poolKey, poolId, nodeId, callback) {
    logger.info('Pinging machine');
    call.post('/admin/pools/${poolId}/nodes/${nodeId}/ping', _args().poolKey(poolKey).poolId(poolId).nodeId(nodeId), callback);
};
exports.expirePoolNode = function (poolKey, poolId, nodeId, callback) {
    logger.info('setting node as expired');
    call.post('/account/pools/${poolId}/nodes/${nodeId}/expire', _args().poolKey(poolKey).poolId(poolId).nodeId(nodeId), callback);
};
exports.occupyPoolNode = function (poolKey, poolId, expires, callback) {
    logger.info('occupying machine in pool'); // todo: cahnge to post
    call.get('/account/pools/${poolId}/occupy', _args().poolKey(poolKey).poolId(poolId).data( expires + ''), callback);
};

exports.readPoolErrors = function (poolKey, poolId, callback) {
    logger.info('reading pool errors in pool [%s]', poolId);
    call.get('/admin/pools/${poolId}/errors', _args().poolKey(poolKey).poolId(poolId), callback);
};
exports.deletePoolErrors = function (poolKey, poolId, callback) {
    logger.info('deleting pool errors in pool [%s]', poolId);
    call.post('/admin/pools/${poolId}/errors/delete', _args().poolKey(poolKey).poolId(poolId), callback);
};
exports.readPoolTasks = function (poolKey, poolId, callback) {
    logger.info('reading pool tasks in pool [%s]', poolId);
    call.get('/admin/pools/${poolId}/tasks', _args().poolKey(poolKey).poolId(poolId), callback);
};
exports.deletePoolTask = function (poolKey, poolId, taskId, callback) {
    logger.info('deleting pool task [%s] from pool [%s]', taskId, poolId);
    call.post('/admin/pools/${poolId}/tasks/${taskId}/delete', _args().poolKey(poolKey).poolId(poolId).taskId(taskId), callback);
};

exports.readPoolDecisions = function (poolKey, poolId, callback) {
    logger.info('reading pool decisions in pool [%s]', poolId);
    call.get('/admin/pools/${poolId}/decisions', _args().poolKey(poolKey).poolId(poolId), callback);
};

exports.readThreadPools = function (poolKey, callback) {
    logger.info('reading threadPools' );
    call.get('/admin/pools/threadPools', _args().poolKey(poolKey), callback);
};

exports.readDataSourcesStatus = function (poolKey, callback) {
    logger.info('reading DataSources status' );
    call.get('/admin/datasources', _args().poolKey(poolKey), callback);
};

exports.abortPoolDecision = function (poolKey, poolId, decisionId, callback) {
    logger.info('aborting pool decision [%s] in pool [%s]', decisionId, poolId);
    call.post('/admin/pools/${poolId}/decisions/${decisionId}/abort', _args().poolKey(poolKey).poolId(poolId).decisionId(decisionId), callback);
};
exports.updatePoolDecisionApproval = function (poolKey, poolId, decisionId, approved, callback) {
    logger.info('updating pool decision [%s] in pool [%s]', decisionId, poolId);
    call.post('/admin/pools/${poolId}/decisions/${decisionId}/approved/${approved}', _args().poolKey(poolKey).poolId(poolId).decisionId(decisionId).approved(approved), callback);
};

exports.readCloudNodes = function (poolKey, poolId, callback) {
    logger.info('reading cloud nodes for pool [%s]', poolId);
    call.get('/admin/pools/${poolId}/cloud/nodes', _args().poolKey(poolKey).poolId(poolId), callback);
};


/**************** ACCOUNT LEVEL CALLS ***************************/

exports.accountReadPools = function (poolKey, callback) {
    logger.info('reading account pools');
    call.get('/account/pools', _args().poolKey(poolKey), callback);
};

exports.readPoolBootstrapScript = function (poolKey, callback) {
    logger.info('reading pool default bootstrarp script');
    call.get('/account/pools/script', _args().poolKey(poolKey), callback);
};

exports.createPool = function (poolKey, poolSettings, callback) {
    logger.info('creating pool for account');
    call.post('/account/pools', _args().poolKey(poolKey), callback);
};

exports.updatePool = function (poolKey, poolId, poolSettings, callback) {
    logger.info('updating pool [%s] for account ', poolId);
    call.post('/account/pools/${poolId}', _args().poolKey(poolKey).poolId(poolId).data(poolSettings), callback);
};

exports.deletePool = function (poolKey, poolId, callback) {
    logger.info('deleting pool [%s] for account', poolId);
    call.post('/account/pools/${poolId}/delete', _args().poolKey(poolKey).poolId(poolId), callback);
};

exports.accountReadPoolStatus = function (poolKey, poolId, callback) {
    logger.info('get pool [%s] status for account ', poolId);
    call.get('/account/pools/${poolId}/status', _args().poolKey(poolKey).poolId(poolId), callback);
};

exports.accountReadPoolsStatus = function (poolKey, callback) {
    logger.info('reading all pools  general status');
    call.get('/account/pools/status', _args().poolKey(poolKey), callback);
};
