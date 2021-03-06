// this somehow solves a global leak issue triggered when running
// ChooseOneXelementFromCollectionView tests...would like to get to the bottom of it!
// <hack>
var content, atts;
// </hack>

TestFixtures.XELEMENT_BASE();

describe("Core.Views", function() {
  beforeEach(function() {
    $("body").append("<div id='sandbox' style='display:none;'>");
  })

  afterEach(function() {
    $("body > div#sandbox").remove();
  })

  describe("Dynamo.ShowXelementSimpleView", function() {
    var attrs = TestFixtures.UnitaryXelementAttributes();
    var vals = attrs.xel_data_values;

    it("should render only the title and specified attrs", function() {
      var model = new Dynamo.UnitaryXelement(attrs);
      var view = new Dynamo.ShowXelementSimpleView({
        model: model,
        el: "div#sandbox",
        atts_to_display: ["cats", "recipe", "hammerTime", "quotation"]
      });
      view.render();
      assert.equal(vals.title, $.trim($(".attribute.title").html()));
      assert.equal(JSON.stringify(vals.cats), $(".attribute.cats").html());
      assert.equal(JSON.stringify(vals.recipe), $(".attribute.recipe").html());
      assert.equal(JSON.stringify(new Date(vals.hammerTime)), $(".attribute.hammerTime").html());
      assert.equal(JSON.stringify(vals.quotation), $(".attribute.quotation").html());
      assert.equal(0, $(".attribute.onceUponATime").length);
    })
  })

  describe("Dynamo.ShowArrayView", function() {
    var view;

    beforeEach(function() {
      $("div#sandbox").append("<div class='array-view'></div>");
      view = new Dynamo.ShowArrayView({
        container: "div#sandbox",
        elementTemplate: "<div class='item'>(%= item %)</div>",
        contentWhenEmpty: "The dark side"
      });
    })

    it("should render each item", function() {
      view.getArrayFn = function() { return ["Han Solo"] };
      view.render();
      assert.equal("Han Solo", $(".array-view:first").text());
    })

    it("should render the default when the array is empty", function() {
      view.getArrayFn = function() { return [] };
      view.render();
      assert.equal("The dark side", $(".array-view:first").text());
    })

    it("should add the onElementClick listener to each el with class item", function(done) {
      // wrapping done in anon fn b/c it doesn't like being called w/ non-err args
      view.onElementClick = function(clickEvent) {  
        //would like to assert something about the argument here.
        done() 
      };
      view.getArrayFn = function() { return ["Han Solo"] };
      view.render();
      $("div.array-view > .item").trigger("click");
    })
  })

  describe("Dynamo.InputSliderView", function() {
    beforeEach(function() {
      var view = new Dynamo.InputSliderView({
        el: "#sandbox",
        low_end_text: "low",
        high_end_text: "high",
        initial_value: 2,
        min_value: -1,
        max_value: 5,
        step: 1
      });
      view.render();
    })

    it("renders", function() {
      assert.equal(1, $("div#sandbox .ui-slider").length)
    })
  })

  describe("Dynamo.ChooseOneXelementFromCollectionView", function() {
    var view;
    var viewOptions;

    function renderView(options) {
      view = new Dynamo.ChooseOneXelementFromCollectionView(options || viewOptions);
      view.render();
    }

    beforeEach(function() {
      var tywin = { xel_data_types: { title: "string"}, xel_data_values: { title: "Tywin" } };
      var cersei = { xel_data_types: { title: "string"}, xel_data_values: { title: "Cercei" } };
      var collection = new Backbone.Collection([
        new Dynamo.UnitaryXelement(tywin),
        new Dynamo.UnitaryXelement(cersei)
      ]);
      collection.prettyModelName = function() { return "Family Member"; };
      viewOptions = {
        el: "div#sandbox",
        collection: collection,
        collection_name: "The Lannisters"
      }
    })

    it("should render radio buttons", function() {
      renderView();
      assert.equal("Tywin", $("label.radio:first > span").text());
      assert.equal("Cercei", $("label.radio:last > span").text());
    })

    it("should trigger an event by default when a button is selected", function(done) {
      renderView();
      //Refactor to have the arg passed to the function be the chosen element as discussed.
      view.on("element:chosen", done);  
      $("label.radio:first input").trigger("click");
      view.off("element:chosen");
    })

    it("should call onChoose when defined and a button is selected", function(done) {
      //assert that onChoose method's var is the chosen element.
      viewOptions.onChoose = function() { done() };
      renderView(viewOptions);
      $("label.radio:first input").trigger("click");
    })

    it("should allow choosing a new model instance when canCreateNew is true", function(done) {
      viewOptions.canCreateNew = true;
      viewOptions.xelement_type = "question";
      renderView(viewOptions);
      view.on("element:chosen", done);
      $(".widget-content button.create_new").trigger("click");
      view.off("element:chosen");
    })
  })

  describe("Dynamo.ShowUserView", function() {
    beforeEach(function() {
      var view = new Dynamo.ShowUserView({
        el: "div#sandbox",
        model: new Backbone.Model({ username: "lola", guid: 123 })
      });
      view.render();
    })

    it("should render the username and guid", function() {
      assert.equal("lola", $(".attribute.username").text());
      assert.equal("(123)", $(".attribute.guid").text());
    })
  })

  describe("Dynamo.ModelBackoutView", function() {
    var mockModel;
    var view;

    beforeEach(function() {
      mockModel = new Backbone.Model({
        title: "foo",
        start_month: 2,
        start_date: 20,
        start_year: 1999,
        start_hour: 15,
        start_minute: 30,
        end_month: 3,
        end_date: 2,
        end_year: 1999,
        end_hour: 1,
        end_minute: 0,
        tags: ["alpha", "beta", "gamma"],
        inReviewing: false,
        inScheduling: false,
        actual_pleasure: 4,
        actual_accomplishment: 8,
        emotion: "anxious",
        emotion_intensity: 5,
        inMonitoring: true,
        motivation: "goal_directed",
        startAndEndDaysAreEqual: false
      });
      mockModel.get_field_value = function(attr) {
        return this.get(attr);
      };
      mockModel.set_field_values = function(object, options) {};
      view = new Dynamo.ModelBackoutView({
        model: mockModel,
        el: "div#sandbox",
        knockoutTemplate: DIT["dynamo/activity_tracker/edit_event"],
        arrayDefaults: {},
        computedAtts: {
          startAndEndDaysAreEqual: {
            read: function() {
              return this.view.knockoutModel.start_date() >
                this.view.knockoutModel.end_date();
            },
            write: function() {}
          }
        }
      });
      view.render();
    })

    describe("changing input values", function() {
      it("should cause the model field to be set", function() {
        sinon.spy(mockModel, "set_field_values");
        $("button.add-tag-attribute").click();
        $("input.edit-tag-attribute:last").val("kappa").trigger("change");
        assert.deepEqual(["alpha", "beta", "gamma", "kappa"],
                         mockModel.set_field_values.lastCall.args[0].tags);
        mockModel.set_field_values.restore();
      })

      it("should trigger change events on the model", function(done) {
        mockModel.on("change:fromKnockout:title", done);
        $("input#title-attribute-input").val("bar").trigger("change");
        mockModel.off("change:fromKnockout:title");
      })
    })

    describe("changing model attributes", function() {
      it("should update the input value", function() {
        mockModel.set({ end_hour: 2 });
        assert.equal(2, $("select#end-time-hour").val());
      })
    })

    describe("changing computed values", function() {
      it("should trigger change events on the model", function(done) {
        mockModel.on("change:fromKnockout:startAndEndDaysAreEqual", done);
        $("input#end-time-day").val($("input#start-time-day").val()).trigger("change");
        mockModel.off("change:fromKnockout:startAndEndDaysAreEqual");
      })
    })
  })

  describe("Dynamo.ManageCollectionView", function() {
    var viewOptions;
    var TestView = Backbone.View.extend({
      render: function() {
        this.$el.html(this.model.get("title"));
      }
    });
    var TestEditView = Backbone.View.extend({
      render: function() {
        this.$el.html("<input type='text' value='" + this.model.get("title") + "'>");
      }
    });

    function renderView(options) {
      var view = new Dynamo.ManageCollectionView(options || viewOptions);
      return view.render();
    }

    beforeEach(function() {
      var collection = new Backbone.Collection([
        { title: "Doc" },
        { title: "Sleepy" }
      ]);
      collection.codeModelName = function() { return "Sprocket"; };
      collection.prettyModelName = function() { return "Sprocket"; };
      viewOptions = {
        el: "div#sandbox",
        collection: collection,
        viewClass: TestView,
        editViewClass: TestEditView,
        display: {
          show: true,
          edit: true,
          create: true,
          del: true
        }
      };
    })

    it("should wire up the addNewHandler", function(done) {
      viewOptions.addNewHandler = function() { done() };
      renderView(viewOptions);
      $("button.add-new-Sprocket:first").trigger("click");
    })

    it("should wire up the addExistingHandler", function(done) {
      viewOptions.enableAddExisting = true;
      viewOptions.addExistingHandler = function() { done() };
      renderView(viewOptions);
      $("button.add-existing-Sprocket:first").trigger("click");
    })

    it("should enable element deletion", function() {
      var view = renderView();
      var elementCount = $(".elements .element").length;
      var modelCount = view.collection.length;
      $("button.delete.Sprocket:first").trigger("click");
      assert.equal(elementCount - 1, $(".elements .element").length);
      assert.equal(modelCount - 1, view.collection.length);
    })
  })

  describe("Dynamo.ShowGroupView", function() {
    beforeEach(function() {
      sinon.stub(Dynamo, "ManageCollectionView", function() { return new Backbone.View() });
    })

    afterEach(function() {
      Dynamo.ManageCollectionView.restore();
    })

    it("should pass a smoke test", function() {
      var view = new Dynamo.ShowGroupView({
        model: new Backbone.Model(),
        template: "<div></div>"
      });
      view.render();
    })
  })

  describe("Dynamo.EditGroupView", function() {
    beforeEach(function() {
      sinon.stub(Dynamo, "ManageCollectionView", function() { return new Backbone.View() });
    })

    afterEach(function() {
      Dynamo.ManageCollectionView.restore();
    })

    it("should pass a smoke test", function() {
      var model = new Backbone.Model();
      model.toFormValues = function() { return null };
      var view = new Dynamo.EditGroupView({
        model: model,
        template: "<div></div>"
      });
      view.render();
    })
  })
})