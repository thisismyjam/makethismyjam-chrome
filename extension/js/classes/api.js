Jamlet.API = function(){};

Jamlet.API.prototype = {
  baseWebURL: 'http://www.thisismyjam.com',
  baseAPIURL: 'http://api.thisismyjam.com',
  apiKey: '80403541f0349e10305d0021e8bc0c7d',
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
      data: {key: this.apiKey},
      success: function(data) {
        callback(null, data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        callback({status: jqXHR.status});
      }
    })
  }
};
