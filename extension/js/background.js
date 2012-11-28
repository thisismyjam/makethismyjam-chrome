Jamlet.Browser.init();

Jamlet.LastOpenedPopup = new Backbone.Model();
Jamlet.HomeFeed = new Jamlet.HomeFeedCollection([], {timeKeeper: Jamlet.LastOpenedPopup});

Jamlet.CreateJam = new Jamlet.CreateJamModel({api: Jamlet.API, browser: Jamlet.Browser});

Jamlet.Badge.initialize({homeFeed: Jamlet.HomeFeed, createJam: Jamlet.CreateJam});

Jamlet.HomeFeedChecker = new Jamlet.Checker({model: Jamlet.HomeFeed});
Jamlet.HomeFeedChecker.start();
