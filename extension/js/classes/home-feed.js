Jamlet.HomeFeed = Backbone.Collection.extend({
  initialize: function(models, options) {
    this.api = options.api;
    this.timeKeeper = options.timeKeeper;
    this._hasLoadedOnce = false;

    this.timeKeeper.on('update', this.filterJams, this);
    this.on('reset', this.filterJams, this);
  },

  fetch: function(options) {
    options = options || {};

    var collection = this;
    var api = this.api;

    api.authenticate(function(error, response) {
      if (error) return;

      api.fetchHomeFeed(function(error, response) {
        if (response) {
          collection._hasLoadedOnce = true;
          collection.reset(response.jams);

          if (typeof(options.success) === 'function') {
            options.success(collection, response, {});
          }
        }
      });
    });
  },

  hasLoadedOnce: function() {
    return this._hasLoadedOnce;
  },

  filterJams: function(jams) {
    var api = this.api;
    var myJam = this.find(function(jam) {
      return jam.get('from') === api.credentials.username;
    });

    if (myJam) this.remove(myJam);

    var timestamp = this.timeKeeper.getTimestamp();

    if (timestamp) {
      this.each(function(jam) {
        if (jam.get('seen') === false) {
          var creationDate = new Date();
          creationDate.setTime(Date.parse(jam.get('creationDate')));

          if (creationDate < timestamp) {
            jam.set({seen: true});
          }
        }
      });
    }
  },

  getUnseenJamCount: function() {
    return this.models.filter(function(jam) { return jam.get('seen') === false }).length;
  }
});
