Jamlet = {
  // TODO: clear badge when lastOpenedPopup is updated
  lastOpenedPopup: null
};

Jamlet.API = {
  baseWebURL: 'http://www.thisismyjam.com',
  baseAPIURL: 'http://api.thisismyjam.com',
  credentials: null,

  fetchHomeFeed: function(callback) {
    this.apiRequest('/' + this.credentials.username + '/homeFeed.json', callback);
  },

  fetchCurrentJam: function(callback) {
    this.apiRequest('/' + this.credentials.username + '.json', callback);
  },

  isAuthenticated: function() {
    return !!this.credentials;
  },

  authenticate: function(callback) {
    if (this.isAuthenticated()) {
      return callback(null, this.credentials);
    }

    $.ajax({
      url: this.baseWebURL + '/signin/credentials',
      dataType: 'json',
      success: function(response) {
        this.credentials = response.credentials;
        callback(null, response.credentials);
      }.bind(this),
      error: function(jqXHR, textStatus, errorThrown) {
        callback({status: jqXHR.status});
      }
    })
  },

  apiRequest: function(path, callback) {
    $.ajax({
      url: this.baseAPIURL + '/1' + path,
      success: function(data) {
        callback(null, data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        callback({status: jqXHR.status});
      }
    })
  }
};

Jamlet.Checker = function(options) {
  this.options  = options;
  this.checkFn  = options.checkFn;
  this.callback = options.callback;
}

Jamlet.Checker.prototype = {
  timeBetweenChecks: 5*60*1000,
  lastError: null,
  lastResponse: null,

  start: function() {
    this.check(true);
  },

  check: function(reschedule) {
    // TODO: handle timeout
    this.checkFn(function(error, response) {
      this.lastError    = error;
      this.lastResponse = response;

      if (this.callback) this.callback(error, response);

      if (reschedule) {
        window.setTimeout(function() {
          this.check(true);
        }.bind(this), this.timeBetweenChecks);
      }
    }.bind(this));
  }
};

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

Jamlet.HomeFeedChecker.start();

Jamlet.Browser = {
  currentTab: null,

  init: function() {
    chrome.tabs.onActivated.addListener(this.tabActivated.bind(this));
  },

  tabActivated: function(tab) {
    this.currentTab = tab;
  },

  createTab: function(options) {
    chrome.tabs.create(options);
  },

  fetchCurrentTabURL: function(callback) {
    if (!this.currentTab) return callback(null);

    chrome.tabs.get(this.currentTab.tabId, function(tab) {
      if (tab) {
        return callback(tab.url);
      } else {
        return callback(null);
      }
    });
  },

  updateBadge: function(options) {
    if (options.hasOwnProperty('color'))
      chrome.browserAction.setBadgeBackgroundColor({color: options.color});

    if (options.hasOwnProperty('text'))
      chrome.browserAction.setBadgeText({text: options.text});
  }
};

Jamlet.Browser.init();
