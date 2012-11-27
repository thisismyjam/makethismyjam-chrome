Jamlet.HomeFeedCollection = Backbone.Collection.extend({
  initialize: function(options) {
    this.timeKeeper = options.timeKeeper;
    this.timeKeeper.on('change', this.filterJams, this);
    this.on('reset', this.filterJams, this);
  },

  fetch: function(callback) {
    Jamlet.API.authenticate(function(error, response) {
      if (error) return;

      Jamlet.API.fetchHomeFeed(function(error, response) {
        if (response) this.reset(response.jams);
        if (callback) callback(error, response);
      }.bind(this));
    }.bind(this));
  },

  filterJams: function(jams) {
    var timestamp = this.timeKeeper.get('lastTimestamp');

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
