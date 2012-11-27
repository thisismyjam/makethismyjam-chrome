Jamlet.Badge = {
  initialize: function(options) {
    this.homeFeed = options.homeFeed;
    this.homeFeed.on('reset', this.updateBadge, this);
    this.homeFeed.on('change:seen', this.updateBadge, this);
  },

  updateBadge: function() {
    var unseenCount = this.homeFeed.getUnseenJamCount();

    if (unseenCount > 0) {
      Jamlet.Browser.updateBadge({
        color: "#00ff00",
        text:  String(unseenCount)
      });
    } else {
      Jamlet.Browser.updateBadge({text: ""});
    }
  }
}