/**
 * Created by liron on 11/26/14.
 */

'use strict';

// example with spies

var Person = function() {};

Person.prototype.helloSomeone = function(toGreet) {
    return this.sayHello() + " " + toGreet;
};

Person.prototype.sayHello = function() {
    return "Hello";
};


describe('Backend: walkFolder', function () {

    it('has a browseBlueprint', function () {
        var controller = require('../../backend/controllers/AdminUsersController');

        var fakePerson = new Person();
        spyOn(fakePerson, "sayHello").andReturn("Hello Hello");

        expect( fakePerson.sayHello()).toBe("Hello Hello")
       // expect(2+2).toBe(4);
    });


});
