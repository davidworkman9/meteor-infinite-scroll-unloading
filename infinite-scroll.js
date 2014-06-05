Items = new Meteor.Collection('items');
if (Meteor.isClient) {
  Template.hello.helpers({
    'placeholderItems': function () {
      return _.times(Session.get('skip'), function () { return Random.id(); });
    },
    'items': function () {
      return Items.find({}, { sort: { name: 1 } }).fetch();
    }
  });

  var limit = 40, downloading = false;
  Template.hello.created = function () {
    Session.set('skip', 0);
    this.deps = this.deps || [];
  };

  Template.hello.destroyed = function () {
    _.each(this.deps, function (d) { d.stop(); });
  };

  Template.hello.rendered = function () {
    this.$('#list')
      .off('scroll.infinite-scroll')
      .on('scroll.infinite-scroll', function () {
        var $list = $(this);
        if (!downloading && $list.scrollTop() >= ($list[0].scrollHeight - $list.height()) ) {
          Session.set('skip', Session.get('skip') + 10);
        }

        $('.scroll_placeholder').each(function (i) {
          if (isScrolledIntoView(this)) {
            Session.set('skip', i > 10 ? i-10 : 0);
            return false;
          }
        });

        function isScrolledIntoView(elem) {
          var docViewTop = $list.offset().top;
          var docViewBottom = $list.height();

          var elemTop = $(elem).offset().top;
          var elemBottom = elemTop + $(elem).height();

          return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
        }
      }
    );

    this.deps.push(Deps.autorun(function () {
      downloading = true;
      Meteor.subscribe('items', Session.get('skip'), limit, function () {
        downloading = false;
      });
    }));
  };
}

if (Meteor.isServer) {

  Meteor.publish('items', function (skip, limit) {
    return Items.find({}, { sort: { name: 1 }, skip: skip, limit: limit });
  });

  Meteor.startup(function () {
    Items.remove({});
    if (Items.find().count() === 0)
      _.times(10000, function (i) { Items.insert({ name: i }); });
  });
}
