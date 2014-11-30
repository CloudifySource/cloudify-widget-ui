/**
 * Created by liron on 11/27/14.
 */

describe('Backend: walkFolder', function () {

    var adminUsersController = require('../../backend/controllers/AdminUsersController');


    it('test setPoolKey', function () {



        //  expect( function(){  cloudifyCliService.executeCommand(testOptions, name); } ).toThrow(new Error('onExit callback must be a function'));

        var req = {
           params : { uesrId:"myid123"},
           user : {poolKey:"keykeykey"}
        };

        var res = {

        } ;

       // var mockedAdminUsersController =  require('../../backend/controllers/AdminUsersController');
       // spyOn(mockedAdminUsersController, "updateAccountDescription").andReturn(callback);

       // adminUsersController.setPoolKey(req,res);
        adminUsersController.loadUser(req, res, next)

    });


});
