'use strict';
//var logger = require('log4js').getLogger('PoolController');

var managers = require('../managers');

function _callback( res, callback ){
    return function( err, data ){
        if ( !!err ){
            res.send(err.response.statusCode, err.data);
        }
        if ( !!callback ){
            callback(data);
        }
        else{
            res.send(data);
        }
    };
}

exports.createUsers = function( req, res ){
    managers.poolClient.createAccount(req.user.poolKey, _callback(res));
};

exports.readAccounts = function (req, res) {
    managers.poolClient.readAccounts(req.user.poolKey, _callback(res));
};


exports.adminReadPools = function ( req, res ){
    managers.poolClient.adminReadPools(req.user.poolKey, _callback(res));
};

exports.adminReadPoolBootstrapScript = function ( req, res ){
    managers.poolClient.adminReadPoolBootstrapScript(req.user.poolKey, _callback(res));
};

exports.adminReadAccountPools = function( req, res ){
    managers.poolClient.adminReadAccountPools(req.user.poolKey, req.params.accountId, _callback(res));
};

exports.adminSetAccountDescription = function( req, res ){
    if ( !req.body || !req.body.description ){
        res.send(500, {'message' : 'description is not set'});
    }
    managers.poolClient.setAccountDescription( req.user.poolKey, req.params.accountId, req.body.description, _callback(res) );
};

exports.createAccountPool = function( req, res ){
    managers.poolClient.createAccountPool(req.user.poolKey, req.params.accountId, req.body, _callback(res));
};

exports.updateAccountPool = function( req, res ){
    managers.poolClient.updateAccountPool(req.user.poolKey, req.params.accountId, req.params.poolId, req.body, _callback(res));
};

exports.deleteAccountPool = function( req, res ){
    managers.poolClient.deleteAccountPool(req.user.poolKey, req.params.accountId, req.params.poolId, _callback(res));
};

exports.cleanAccountPool = function( req, res ){
    managers.poolClient.cleanAccountPool(req.user.poolKey, req.params.accountId, req.params.poolId, _callback(res));
};

exports.adminReadAccountPool = function( req, res ){
    managers.poolClient.readAccountPool(req.user.poolKey, req.params.accountId, req.params.poolId, _callback(res));
};

// detailed status
exports.readPoolStatus = function( req, res ){
    managers.poolClient.readPoolStatus(req.user.poolKey, req.params.poolId, _callback(res));
};
// general status
exports.readPoolsStatus = function( req, res ){
    managers.poolClient.readPoolsStatus(req.user.poolKey, _callback(res));
};

exports.readPoolNodes = function( req, res ){
    managers.poolClient.readPoolNodes(req.user.poolKey, req.params.poolId, _callback(res));
};
exports.createPoolNode = function( req, res ){
    managers.poolClient.createPoolNode(req.user.poolKey, req.params.poolId, _callback(res));
};
exports.deletePoolNode = function( req, res ){
    managers.poolClient.deletePoolNode(req.user.poolKey, req.params.poolId, req.params.nodeId, _callback(res));
};
exports.deleteCloudNode = function( req, res ){
    managers.poolClient.deleteCloudNode(req.user.poolKey, req.params.poolId, req.params.machineId, _callback(res));
};
exports.bootstrapPoolNode = function( req, res ){
    managers.poolClient.bootstrapPoolNode(req.user.poolKey, req.params.poolId, req.params.nodeId, _callback(res));
};

exports.pingNode = function (req, res) {
    managers.poolClient.pingNode(req.user.poolKey, req.params.poolId, req.params.nodeId, _callback(res));
};

exports.readPoolErrors = function( req, res ){
    managers.poolClient.readPoolErrors(req.user.poolKey, req.params.poolId, _callback(res));
};
exports.deletePoolErrors = function( req, res ){
    managers.poolClient.deletePoolErrors(req.user.poolKey, req.params.poolId, _callback(res));
};
exports.readPoolTasks = function( req, res ){
    managers.poolClient.readPoolTasks(req.user.poolKey, req.params.poolId, _callback(res));
};
exports.deletePoolTask = function( req, res ){
    managers.poolClient.deletePoolTask(req.user.poolKey, req.params.poolId, req.params.taskId, _callback(res));
};

exports.readPoolDecisions = function( req, res ){
    managers.poolClient.readPoolDecisions(req.user.poolKey, req.params.poolId, _callback(res));
};

exports.readThreadPools = function( req, res ){
    managers.poolClient.readThreadPools(req.user.poolKey, _callback(res));
};

exports.readDataSourcesStatus = function( req, res ){
    managers.poolClient.readDataSourcesStatus(req.user.poolKey, _callback(res));
};

exports.abortPoolDecision = function ( req, res ) {
    managers.poolClient.abortPoolDecision(req.user.poolKey, req.params.poolId, req.params.decisionId, _callback(res));
};
exports.updatePoolDecisionApproval = function ( req, res ) {
    managers.poolClient.updatePoolDecisionApproval(req.user.poolKey, req.params.poolId, req.params.decisionId, req.params.approved, _callback(res));
};

exports.readCloudNodes = function( req, res ){
    managers.poolClient.readCloudNodes(req.user.poolKey, req.params.poolId, _callback(res));
};


/**************** ACCOUNT LEVEL CALLS ***************************/

exports.accountReadPools = function( req, res ){
    managers.poolClient.accountReadPools(req.user.poolKey, _callback(res));
};

exports.accountReadPool = function( req, res ){
    managers.poolClient.accountReadPool(req.user.poolKey, req.params.poolId, _callback(res));
};

exports.readPoolBootstrapScript = function( req, res ){
    managers.poolClient.readPoolBootstrapScript(req.user.poolKey, _callback(res));
};

exports.createPool = function( req, res ){
    managers.poolClient.createPool(req.user.poolKey, req.body, _callback(res));
};

exports.updatePool = function( req, res ){
    managers.poolClient.updatePool(req.user.poolKey, req.params.poolId, req.body, _callback(res));
};

exports.deletePool = function( req, res ){
    managers.poolClient.deletePool(req.user.poolKey, req.params.poolId, _callback(res));
};

exports.accountReadPoolStatus = function( req, res ){
    managers.poolClient.accountReadPoolStatus(req.user.poolKey, req.params.poolId, _callback(res));
};

exports.accountReadPoolsStatus = function( req, res ){
    managers.poolClient.accountReadPoolsStatus(req.user.poolKey, _callback(res));
};


