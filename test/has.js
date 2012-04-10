(function() {

  var User, Users, Membership, Memberships, Settings, Group, Groups;
  var Model = Supermodel.Model;
  var Collection = Supermodel.Collection;

  var setup = function() {
    if (Model.all) {
      Model.all.reset([]);
      Model.all = null;
    }

    if (User && User.all) {
      User.all.reset([]);
      User.all = null;
    }

    if (Membership && Membership.all) {
      Membership.all.reset([]);
      Membership.all = null;
    }

    if (Group && Group.all) {
      Group.all.reset([]);
      Group.all = null;
    }

    User = Model.extend({
      constructor: function() {
        var o = User.__super__.constructor.apply(this, arguments);
        if (o) return o;
      }
    });

    Membership = Model.extend({
      constructor: function() {
        var o = Membership.__super__.constructor.apply(this, arguments);
        if (o) return o;
      }
    });

    Group = Model.extend({
      constructor: function() {
        var o = Group.__super__.constructor.apply(this, arguments);
        if (o) return o;
      }
    });

    Settings = Model.extend({
      constructor: function() {
        var o = Settings.__super__.constructor.apply(this, arguments);
        if (o) return o;
      }
    });

    Users = Collection.extend({model: User});
    Memberships = Collection.extend({model: Membership});
    Groups = Collection.extend({model: Group});

    Membership.has()
      .one('user', {
        model: User,
        inverse: 'memberships'
      })
      .one('group', {
        model: Group,
        inverse: 'memberships'
      });

    Settings.has()
      .one('user', {
        model: User,
        inverse: 'settings'
      });

    User.has()
      .one('settings', {
        model: Settings,
        inverse: 'user'
      })
      .many('memberships', {
        collection: Memberships,
        inverse: 'user'
      })
      .many('contacts', {
        source: 'users',
        collection: Users
      });

    Group.has()
      .many('memberships', {
        collection: Memberships,
        inverse: 'group'
      });
  };

  module('One', {setup: setup});

  test('Setting associations.', function() {
    var user = new User({id: 5});
    var membership = new Membership({id: 3, user_id: 5});
    ok(membership.user === user, 'Initialize association.');
    membership.set({user_id: null});
    ok(!membership.user, 'Remove association on change.');
    membership.set({user_id: 5});
    ok(membership.user === user, 'Add association on change.');
  });

  test('Parsing associations.', function() {
    var membership = new Membership({id: 2});
    membership.parse({user: {id: 4}});
    var user = membership.user;
    ok(user instanceof User);
    strictEqual(user.id, 4);
    // Association should not be removed if not included.
    membership.parse({});
    ok(membership.user === user);
  });

  test('Handle ids that are strings.', function() {
    var user = new User({id: 3});
    var membership = new Membership({id: 2, user_id: '3'});
    ok(membership.user === user);
    membership.set({user_id: '3'});
    ok(membership.user === user);
  });

  test('Parse without id.', function() {
    var membership = new Membership({id: 1, user: {id: 2}}, {parse: true});
    var user = membership.user;
    ok(user instanceof User);
    strictEqual(user.id, 2);
  });

  test('With inverse.', function() {
    var user = new User({id: 1});
    var settings = new Settings({id: 1, user_id: 1});

    ok(user.settings === settings);
    strictEqual(user.get('settings_id'), 1);
    ok(settings.user === user);
    strictEqual(settings.get('user_id'), 1);

    user.unset('settings_id');
    ok(!user.settings);
    ok(!user.get('settings_id'));
    ok(!settings.user);
    ok(!settings.get('user_id'));
  });

  test('Dissociate on destroy.', function() {
    var user = new User({id: 1});
    var settings = new Settings({id: 1, user_id: 1});

    settings.trigger('destroy', settings);
    ok(!user.settings);
    ok(!user.get('settings_id'));
    ok(!settings.user);
    ok(!settings.get('user_id'));
  });

  module('Many', {setup: setup});

  test('Many is initialized only once.', function() {
    var user = new User();
    var memberships = user.memberships;
    User.all.trigger('add', user, User.all);
    ok(user.memberships === memberships);
  });

  test('Source is removed after parsing.', function() {
    var user = new User({memberships: [{id: 1}]}, {parse: true});
    strictEqual(user.memberships.length, 1);
    strictEqual(user.memberships.at(0).id, 1);
    ok(!user.get('memberships'));
  });

  test('Associations are triggered on "change".', 2, function() {
    var user = new User({id: 2});
    var membership = new Membership({id: 3});
    user.on('associate:memberships', function() {
      strictEqual(membership.get('x'), true);
    });
    membership.on('associate:user', function() {
      strictEqual(membership.get('x'), true);
    });
    membership.set({user_id: 2, x: true});
  });

  test('Update associations when reparsing.', function() {
    var user = new User({
      id: 1,
      memberships: [{
        id: 2,
        group: {id: 3}
      }]
    }, {parse: true});
    var membership = user.memberships.at(0);
    strictEqual(membership.id, 2);
    strictEqual(membership.group.id, 3);
    user.parse({
      memberships: [{
        id: 4,
        group: {id: 5}
      }]
    });
    membership = user.memberships.at(0);
    strictEqual(membership.id, 4);
    strictEqual(membership.group.id, 5);
  });

  test('Many with source.', function() {
    var user = new User({id: 1, users: [{id: 2}]}, {parse: true});
    strictEqual(user.contacts.at(0).id, 2);
  });

  test('Many references correct inverse.', function() {
    var user = new User({id: 1, memberships: [{id: 2}]}, {parse: true});
    var membership = user.memberships.at(0);
    ok(membership.user === user);
    strictEqual(membership.id, 2);
  });

  test('Dissociate when removed.', function() {
    var user = new User({id: 1, memberships: [{id: 2}]}, {parse: true});
    var membership = user.memberships.at(0);
    ok(membership.user === user);
    user.memberships.remove(membership);
    ok(!membership.user);
  });

  test('Associate on add.', function() {
    var user = new User();
    var membership = new Membership();
    user.memberships.add(membership);
    ok(membership.user === user);
  });

  test('Add on associate.', function() {
    var user = new User({id: 1});
    var membership = new Membership();
    membership.parse({user: {id: 1}});
    ok(user.memberships.at(0) === membership, 'Membership added.');
    ok(membership.user === user, 'User property set.');
  });

  test('Remove on dissociate.', function() {
    var user = new User({id: 1, memberships: [{id: 2}]}, {parse: true});
    strictEqual(user.memberships.length, 1);
    var membership = user.memberships.at(0);
    membership.unset('user_id');
    strictEqual(user.memberships.length, 0);
    ok(!membership.user);
  });

  test('Set id attribute.', function() {
    var user = new User({id: 1, memberships: [{id: 2}]}, {parse: true});
    strictEqual(user.memberships.at(0).get('user_id'), 1);
    var membership = new Membership({id: 3, users: [{id: 4}]}, {parse: true});
    strictEqual(membership.get('user_id'), 4);
  });

})();
