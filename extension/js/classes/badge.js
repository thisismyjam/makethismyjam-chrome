Jamlet.Badge = function(options) {
  this.initialize(options);
};

Jamlet.Badge.prototype = {
  initialize: function(options) {
    this.homeFeed = options.homeFeed;
    this.createJam = options.createJam;
    this.browser = options.browser;

    this.homeFeed.on('reset', this.updateBadge, this);
    this.homeFeed.on('change:seen', this.updateBadge, this);

    this.createJam.on('change', this.updateIcon, this);
  },

  updateBadge: function() {
    var unseenCount = this.homeFeed.getUnseenJamCount();

    if (unseenCount > 0) {
      this.browser.updateBadge({
        color: "#ffde00",
        text:  String(unseenCount)
      });
    } else {
      this.browser.updateBadge({text: ""});
    }
  },

  updateIcon: function() {
    var path = this.createJam.get('jammable') ? "/img/toolbar/icon_on.png" : "/img/toolbar/icon_rest.png";
    this.browser.setToolbarIconPath(path);
  }
}