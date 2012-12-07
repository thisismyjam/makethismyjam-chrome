Jamlet.Browser = function(){
  this.init();
};

Jamlet.Browser.prototype = {
  currentTabId: null,

  init: function() {
    chrome.tabs.onActivated.addListener(this.updateCurrentTabId.bind(this));
  },

  updateCurrentTabId: function(tabInfo) {
    this.currentTabId = tabInfo.tabId;
  },

  onJamHomepageLoaded: function(callback) {
    var event = chrome.extension.onMessage || chrome.extension.onRequest;

    event.addListener(function(request, sender, sendResponse) {
      if (request.type === 'jamHomepageLoaded') {
        callback();
      }
    })
  },

  getExtensionVersion: function(callback) {
    $.getJSON('manifest.json', function(manifest) {
      callback(manifest.version);
    });
  },

  onTabChanged: function(callback) {
    chrome.tabs.onActivated.addListener(function(tabInfo) {
      this._fetchTab(tabInfo.tabId, callback);
    }.bind(this));

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      if (tabId === this.currentTabId) {
        callback({
          url:   tab.url,
          title: tab.title
        });
      } else {
        // ignore background tab changes
      }
    }.bind(this));
  },

  fetchCurrentTab: function(callback) {
    if (this.currentTabId) {
      this._fetchTab(this.currentTabId, callback);
    } else {
      callback(null);
    }
  },

  _fetchTab: function(tabId, callback) {
    chrome.tabs.get(tabId, function(tab) {
      if (tab) {
        callback({
          url:   tab.url,
          title: tab.title
        });
      } else {
        callback(null);
      }
    });
  },

  createTab: function(options) {
    chrome.tabs.create(options);
  },

  updateBadge: function(options) {
    if (options.hasOwnProperty('color'))
      chrome.browserAction.setBadgeBackgroundColor({color: options.color});

    if (options.hasOwnProperty('text'))
      chrome.browserAction.setBadgeText({text: options.text});
  },

  setToolbarIconPath: function(path) {
    chrome.browserAction.setIcon({path: path});
  }
};
