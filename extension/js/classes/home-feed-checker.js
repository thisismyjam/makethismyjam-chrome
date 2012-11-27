Jamlet.HomeFeedChecker = new Jamlet.Checker({
  checkFn: function(callback) {
    Jamlet.API.authenticate(function(error, response) {
      if (!error)
        Jamlet.API.fetchHomeFeed(callback);
    });
  },

  callback: function(error, response) {
    var newJams = response.jams.filter(function(jam) {
      return (jam.seen === false);
    });

    if (Jamlet.lastOpenedPopup) {
      newJams = response.jams.filter(function(jam) {
        var creationDate = new Date();
        creationDate.setTime(Date.parse(jam.creationDate));
        return creationDate > Jamlet.lastOpenedPopup;
      });
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
