Jamlet = {};

Jamlet.API = {
  baseWebURL: 'http://www.thisismyjam.com',
  baseAPIURL: 'http://api.thisismyjam.com',

  fetchHomeFeed: function(callback) {
    this.authenticate(function(error, credentials) {
      if (error) return callback(error);
      this.apiRequest('/' + credentials.username + '/homeFeed.json', callback);
    }.bind(this));
  },

  authenticate: function(callback) {
    $.ajax({
      url: this.baseWebURL + '/signin/credentials',
      dataType: 'json',
      success: function(response) {
        callback(null, response.credentials);
      },
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

  fetchCurrentTabIsJammable: function(callback) {
    if (!this.currentTab) return callback(null);

    chrome.tabs.get(this.currentTab.tabId, function(tab) {
      if (tab && this.isPotentiallyJammable(tab.url)) {
        return callback(this.createJamURL(tab.url));
      } else {
        return callback(null);
      }
    }.bind(this));
  },

  createJamURL: function(url) {
    return 'http://www.thisismyjam.com/jam/create?signin=1&source=jamlet&url=' + encodeURIComponent(url);
  },

  isPotentiallyJammable: function(url) {
    // YouTube watch page
    if (url.match(/^(https?:\/\/)?(www\.)?youtube\.com\/watch.+/i))
      return true;
    
    // Potential SoundCloud track page (TODO: Introspect page to make sure?)
    if (url.match(/^(https?:\/\/)?(www\.)?soundcloud\.com\/[^\/]+\/[^\/]+/i))
      return true;
    
    // Found audio
    if (url.match(/^[^ ]+\/[^ ]+\.mp3$/))
      return true;
    
    // Hype Machine track page
    if (url.match(/^(https?:\/\/)?(www\.)?hypem.com\/track[^\/]+/i))
      return true;
    
    // Potential Bandcamp track page (TODO: Introspect page to make sure?)
    if (url.match(/^(https?:\/\/)[^\/]+\/track\//))
      return true;

    return false;
  }
};

Jamlet.Browser.init();
