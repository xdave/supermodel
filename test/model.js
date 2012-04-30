(function() {

  var Model = Supermodel.Model;
  var Collection = Backbone.Collection;

  var User = Model.extend();
  var Admin = User.extend();

  module('Model', {

    setup: function() {
      User.reset();
      Admin.reset();
    }

  });

  test('Return existing model if present', function() {
    var a = User.create({id: 1});
    var b = User.create({id: 1});
    ok(a === b);
  });

  test('Set values on existing models', function() {
    var a = User.create({id: 1});
    var b = User.create({id: 1, test: 'test'});
    strictEqual(a.get('test'), 'test');
  });

  test('Remember instance after id is set', function() {
    var a = User.create();
    a.set({id: 1});
    ok(a === User.create({id: 1}));
  });

  test('Add instances to inheritance chain', function() {
    var a = Admin.create({id: 1});
    var b = User.create({id: 1});
    ok(a === b);
  });

  test('Passing attributes returns model', function() {
    var user = User.create();
    ok(User.create(user.attributes) === user);
  });

  test('Add model to all during initialize', function() {
    var Test = Model.extend({
      constructor: function(attrs, options) {
        var o = Test.__super__.constructor.apply(this, arguments);
        if (o) return o;
      },
      initialize: function() {
        Test.__super__.initialize.apply(this, arguments);
        ok(Test.create({id: 1}) === this);
      }
    });
    Test.create({id: 1});
  });

  test('Use cid to identify attributes.', function() {
    var Model = Supermodel.Model.extend();
    var model = Model.create();
    deepEqual(model.toJSON(), {});
    strictEqual(model.get('cid'), model.cid);
    ok(Model.create({cid: model.cid}) === model);
  });

  test('Use cidAttribute to identify attributes.', function() {
    var Model = Supermodel.Model.extend({cidAttribute: '_cid'});
    var model = Model.create();
    strictEqual(model.get('_cid'), model.cid);
    deepEqual(model.toJSON(), {});
    ok(Model.create({_cid: model.cid}) === model);
  });

})();
