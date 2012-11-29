Jamlet.TimeKeeper = function(options) {
  this.initialize(options);
};

Jamlet.TimeKeeper.prototype = {
  initialize: function(options) {
    this.localStorageKey = options.localStorageKey;

    var storedTimestamp = localStorage.getItem(this.localStorageKey);
    this.timestamp = storedTimestamp ? new Date(storedTimestamp) : null;
  },

  getTimestamp: function() {
    return this.timestamp;
  },

  updateTimestamp: function() {
    this.timestamp = new Date();
    localStorage.setItem(this.localStorageKey, String(this.timestamp));
    this.trigger('update');
  }
};

_.extend(Jamlet.TimeKeeper.prototype, Backbone.Events);
