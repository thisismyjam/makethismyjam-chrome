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

  onTabChanged: function(callback) {
    chrome.tabs.onActivated.addListener(function(tabInfo) {
      chrome.tabs.get(tabInfo.tabId, function(tab) {
        if (tab) {
          return callback({
            url:   tab.url,
            title: tab.title
          });
        } else {
          return callback(null);
        }
      });
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
