Jamlet.globals = (function() {
  var api             = new Jamlet.API();
  var browser         = new Jamlet.Browser();
  var lastOpenedPopup = new Backbone.Model();
  var homeFeed        = new Jamlet.HomeFeed([], {api: api, timeKeeper: lastOpenedPopup});
  var createJam       = new Jamlet.CreateJam({api: api, browser: browser});
  var badge           = new Jamlet.Badge({homeFeed: homeFeed, createJam: createJam, browser: browser});
  var homeFeedChecker = new Jamlet.Checker({model: homeFeed});

  homeFeedChecker.start();

  return {
    api:             api,
    browser:         browser,
    lastOpenedPopup: lastOpenedPopup,
    homeFeed:        homeFeed,
    createJam:       createJam,
    badge:           badge
  }
})();
