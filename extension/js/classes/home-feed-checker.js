Jamlet.HomeFeedChecker = new Jamlet.Checker({
  checkFn: function(callback) {
    Jamlet.HomeFeed.fetch(callback);
  },

  callback: function(error, response) {
    var unseenCount = Jamlet.HomeFeed.getUnseenJamCount();

    if (unseenCount > 0) {
      Jamlet.Browser.updateBadge({
        color: "#00ff00",
        text:  String(unseenCount)
      });
    } else {
      Jamlet.Browser.updateBadge({text: ""});
    }
  }
});
