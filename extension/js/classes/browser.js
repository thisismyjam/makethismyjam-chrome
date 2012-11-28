Jamlet.Browser = {
  currentTab: null,

  init: function() {
    this.onTabActivated(this.tabActivated.bind(this));
  },

  onTabActivated: function(callback) {
    chrome.tabs.onActivated.addListener(function(tabInfo) {
      this.fetchTab(tabInfo.tabId, callback);
    }.bind(this));
  },

  tabActivated: function(tab) {
    this.currentTab = tab;
  },

  createTab: function(options) {
    chrome.tabs.create(options);
  },

  fetchCurrentTab: function(callback) {
    if (!this.currentTab) return callback(null);
    this.fetchTab(this.currentTab.tabId, callback);
  },

  fetchTab: function(tabId, callback) {
    chrome.tabs.get(tabId, function(tab) {
      if (tab) {
        return callback({
          url:   tab.url,
          title: tab.title
        });
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
  },

  setToolbarIconPath: function(path) {
    chrome.browserAction.setIcon({path: path});
  }
};
