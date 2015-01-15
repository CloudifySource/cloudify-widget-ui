'use strict';

describe('Controller: UserSettingsCtrl', function () {

    // load the controller's module
    beforeEach(module('cloudifyWidgetUiApp'));

    var UserSettingsCtrl,
        mWidgetClient,
        scope;


    beforeEach(inject(function($controller, $rootScope, WidgetClient ){
        scope = $rootScope.$new();
        scope.page = {
            'changePassword' : {
                'newPassword' : 'the new password',
                'oldPassword' : 'the old password',
                'newPasswordAgain' : 'the new password again'
            }
        };
        spyOn(toastr,'success');
        spyOn(toastr,'error');
        spyOn(WidgetClient.userSettings ,'getUserSettings').and.returnValue({
            'then' : function( success, error ){
                success({ data : {} });
                error({});
            }
        });
        mWidgetClient = WidgetClient;
        UserSettingsCtrl = $controller('UserSettingsCtrl', {
            $scope: scope
        });
    }));


    it('should read user settings on load', inject(function () {
        expect(mWidgetClient.userSettings.getUserSettings).toHaveBeenCalled();
        expect(JSON.stringify(scope.myUser)).toBe(JSON.stringify({}));
        expect(toastr.error).toHaveBeenCalled();
    }));

    describe('#changePassword', function(){
        var sendError = false;
        beforeEach(function(){
            toastr.success.calls.reset();
            toastr.error.calls.reset();
            spyOn(mWidgetClient.userSettings,'changePassword').and.returnValue({
                'then' : function(success, error){
                    if ( sendError ){
                        error({ 'data' : { 'error' : 'this is error'}});
                    }else{
                        success();
                    }
                }
            });
        });

        it('should notify about success', inject(function(){

            scope.changePassword();
            expect(toastr.success).toHaveBeenCalled();
            expect(toastr.error).not.toHaveBeenCalled();

        }));

        it('should notify about error', inject(function(){
            sendError = true;
            scope.changePassword();

            expect(toastr.error).toHaveBeenCalled();
            expect(toastr.success).not.toHaveBeenCalled();
        }));
    });

    describe('#testPoolKey', function(){
        var sendError = false;
        beforeEach(function(){

            spyOn(mWidgetClient.userSettings,'testPoolKey').and.returnValue({
                'then' : function( success, error ){
                    if ( sendError ){
                        error();
                    }else{
                        success();
                    }

                }
            });
        });
        it('should put success message on page', function(){
            scope.testPoolKey();
            expect(scope.page.message).toBe('success');
        });

        it('should put error message on page', function(){
            sendError = true;
            scope.testPoolKey();
            expect(scope.page.message).toBe('error!');
        });
    });


    describe('#setPoolKey', function(){

        var errorResponse = null;
        beforeEach(function(){
            spyOn(mWidgetClient.userSettings,'setPoolKey').and.returnValue({
                'then': function(success, error){
                    if ( !!errorResponse ){
                        error( errorResponse );
                    }else{
                        success( { 'data' : 'this is data' }  );
                    }
                }
            });

        });

        it('should set new user settings on scope', function(){
            scope.setPoolKey();
            expect(scope.myUser).toBe('this is data');
        });

        it('should put success message on scope when success', function(){
            scope.setPoolKey();
            expect(scope.page.message).toBe('operation was a success');
        });

        it('should put error message on scope when error', function(){
            errorResponse = { 'data' : 'this is message' };
            scope.setPoolKey();
            expect(scope.page.message).toBe('error! this is message');
        });

        it('should look for message on response and use it instead', function(){
            errorResponse = { 'data' : { 'message' : 'message on data' } };
            scope.setPoolKey();
            expect(scope.page.message).toBe('error! message on data');
        });
    });
});
