Jamlet = {
  baseUrl: 'http://local.thisismyjam.com',

  fetchHomeFeed: function(callback) {
    this.authenticate(function(error, credentials) {
      if (error) return callback(error);
      this.apiRequest('/' + credentials.username + '/homeFeed.json', callback);
    }.bind(this));
  },

  authenticate: function(callback) {
    $.ajax({
      url: this.baseUrl + '/signin/credentials',
      dataType: 'json',
      success: function(response) {
        callback(null, response.credentials);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        callback(textStatus);
      }
    })
  },

  apiRequest: function(path, callback) {
    $.ajax({
      url: this.baseUrl + '/1' + path,
      success: function(data) {
        callback(null, data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        callback(textStatus);
      }
    })
  },

  jamletClicked: function(tab) {
    var destUrl = 'http://www.thisismyjam.com/jam/create?signin=1&source=jamlet&url=' + encodeURIComponent(tab.url);
    chrome.tabs.create({'url': destUrl});
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
