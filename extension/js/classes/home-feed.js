Jamlet.HomeFeedCollection = Backbone.Collection.extend({
  fetch: function(callback) {
    Jamlet.API.authenticate(function(error, response) {
      if (error) return;

      Jamlet.API.fetchHomeFeed(function(error, response) {
        if (response) this.setJams(response.jams);
        callback(error, response);
      }.bind(this));
    }.bind(this));
  },

  setJams: function(jams) {
    if (Jamlet.lastOpenedPopup) {
      jams.forEach(function(jam) {
        if (jam.get('seen') === false) {
          var creationDate = new Date();
          creationDate.setTime(Date.parse(jam.get('creationDate')));
          
          if (creationDate <= Jamlet.lastOpenedPopup) {
            jam.set({seen: true});
          }
        }
      });
    }

    this.reset(jams);
  },

  getUnseenJamCount: function() {
    return this.models.filter(function(jam) { return jam.get('seen') === false }).length;
  }
});

Jamlet.HomeFeed = new Jamlet.HomeFeedCollection();
