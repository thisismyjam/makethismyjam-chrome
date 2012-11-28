Jamlet.Browser.init();

Jamlet.LastOpenedPopup = new Backbone.Model();
Jamlet.HomeFeed = new Jamlet.HomeFeedCollection([], {timeKeeper: Jamlet.LastOpenedPopup});

Jamlet.Badge.initialize({homeFeed: Jamlet.HomeFeed});

Jamlet.HomeFeedChecker = new Jamlet.Checker({model: Jamlet.HomeFeed});
Jamlet.HomeFeedChecker.start();
