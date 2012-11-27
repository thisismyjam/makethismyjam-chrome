Jamlet.HomeFeed = {
  jams: null,

  fetch: function(callback) {
    Jamlet.API.authenticate(function(error, response) {
      if (error) return;

      Jamlet.API.fetchHomeFeed(function(error, response) {
        this.setJams(response.jams);
        callback(error, response);
      }.bind(this));
    }.bind(this));
  },

  setJams: function(jams) {
    if (Jamlet.lastOpenedPopup) {
      jams.forEach(function(jam) {
        var creationDate = new Date();
        creationDate.setTime(Date.parse(jam.creationDate));
        
        if (creationDate <= Jamlet.lastOpenedPopup) {
          jam.seen = true;
        }
      });
    }

    this.jams = jams;
  },

  getJams: function() {
    return this.jams;
  },

  getUnseenJamCount: function() {
    return this.getJams().filter(function(jam) { return jam.seen === false }).length;
  }
}