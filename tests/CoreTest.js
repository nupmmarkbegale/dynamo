var assert = chai.assert;

describe("Core", function() {
  describe(".CurrentUser", function() {
    function TestUser() {
      function n() { return Math.floor((Math.random()*10000)+1); }
      return new Dynamo.User({ guid: n(), group_id: n() });
    }
    
    var user;
    
    beforeEach(function() {
      user = TestUser();
    })
    
    afterEach(function() {
      localStorage.clear();
      Dynamo._CurrentUser = null;
    })
    
    it("should return a preassigned current user", function() {
      Dynamo._CurrentUser = user;
      assert.equal(user, Dynamo.CurrentUser());
    })
    
    it("should return a predefined current user", function() {
      Dynamo.CURRENT_USER_ID = user.get("guid");
      Dynamo.CURRENT_GROUP_ID = user.get("group_id");
      assert.equal(user.get("guid"), Dynamo.CurrentUser().get("guid"));
      assert.equal(user.get("group_id"), Dynamo.CurrentUser().get("group_id"));
      Dynamo.CURRENT_USER_ID = Dynamo.CURRENT_GROUP_ID = null
    })
    
    // this breaks everything until USERS is namespaced
    /*describe("when there is a stored user", function() {
      before(function() {
        localStorage.setItem("CurrentUser", user);
      })
      
      describe("and there is a user collection", function() {
        var otherUser = TestUser();
        
        before(function() {
          otherUser.set("guid", user.get("guid"));
          USERS = new Dynamo.UserCollection([otherUser]);
        })
        
        it("should return the user from the collection", function() {
          assert.equal(otherUser, Dynamo.CurrentUser());
        })
      })
      
      describe("and there is not a user collection", function() {
        it("should return the stored serialized user", function() {
          assert.equal(user, Dynamo.CurrentUser());
        })
      })
    })*/
    
    describe("when a login is required", function() {
      before(function() {
        Dynamo.requireLogin();
        sinon.stub(Dynamo, "redirectTo");
      })
      
      after(function() {
        Dynamo.redirectTo.restore();
        Dynamo._loginRequired = false;
      })
      
      it("should redirect to the login page", function() {
        Dynamo.CurrentUser();
        assert.equal("login.html", Dynamo.redirectTo.getCall(0).args[0]);
      })
    })
    
    describe("when no login is required", function() {
      before(function() {
        this.server = sinon.fakeServer.create();
        this.server.respondWith("POST", /\/users/,
                           [201, { "Content-Type": "application/json" }, '']);
      })
      
      beforeEach(function() {
        Dynamo.CurrentUser();
        this.server.respond();
      })
      
      after(function() {
        this.server.restore();
      })
      
      it("should construct a new user", function() {
        assert.isDefined(Dynamo._CurrentUser);
        assert.isNotNull(Dynamo._CurrentUser);
      })
      
      it("should save the new user in the store", function() {
        assert.isDefined(localStorage.getItem("CurrentUser"));
        assert.isNotNull(localStorage.getItem("CurrentUser"));
      })
      
      it("should save the new user to the server", function() {
        assert.isDefined(this.server.requests[0]);
        assert.isNotNull(this.server.requests[0]);
      })
    })
  })
});
