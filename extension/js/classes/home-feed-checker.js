Jamlet.HomeFeedChecker = new Jamlet.Checker({
  checkFn: function(callback) {
    Jamlet.API.authenticate(function(error, response) {
      if (!error)
        Jamlet.API.fetchHomeFeed(callback);
    });
  },

  callback: function(error, response) {
    var newJams;

    if (Jamlet.lastOpenedPopup) {
      newJams = response.jams.filter(function(jam) {
        var creationDate = new Date();
        creationDate.setTime(Date.parse(jam.creationDate));
        return creationDate > Jamlet.lastOpenedPopup;
      });
    } else {
      // temporary, while we're getting the full home feed back from the server.
      // once we're only getting jams that are new since your last visit, this
      // `else` clause can be removed.
      newJams = [];
    }

    if (newJams.length > 0) {
      Jamlet.Browser.updateBadge({
        color: "#00ff00",
        text:  String(newJams.length)
      });
    } else {
      Jamlet.Browser.updateBadge({text: ""});
    }
  }
});
