Jamlet.Badge = {
  initialize: function(options) {
    this.homeFeed = options.homeFeed;
    this.createJam = options.createJam;

    this.homeFeed.on('reset', this.updateBadge, this);
    this.homeFeed.on('change:seen', this.updateBadge, this);

    this.createJam.on('change', this.updateIcon, this);
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
  },

  updateIcon: function() {
    var path = this.createJam.get('jammable') ? "/img/toolbar/icon_on.png" : "/img/toolbar/icon_rest.png";
    Jamlet.Browser.setToolbarIconPath(path);
  }
}