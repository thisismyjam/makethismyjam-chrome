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
