Jamlet.globals = (function() {
  var api             = new Jamlet.API();
  var browser         = new Jamlet.Browser();
  var lastSawHomeFeed = new Jamlet.TimeKeeper({localStorageKey: "jamlet.lastSawHomeFeed"});
  var homeFeed        = new Jamlet.HomeFeed([], {api: api, timeKeeper: lastSawHomeFeed});
  var createJam       = new Jamlet.CreateJam({api: api, browser: browser});
  var badge           = new Jamlet.Badge({homeFeed: homeFeed, createJam: createJam, browser: browser});
  var homeFeedChecker = new Jamlet.Checker({model: homeFeed});

  homeFeedChecker.start();

  browser.onJamHomepageLoaded(function() {
    lastSawHomeFeed.updateTimestamp();
  });

  var globals = {
    api:             api,
    browser:         browser,
    lastSawHomeFeed: lastSawHomeFeed,
    homeFeed:        homeFeed,
    createJam:       createJam
  };

  browser.getExtensionVersion(function(v) { globals.extensionVersion = v; });

  return globals;
})();
