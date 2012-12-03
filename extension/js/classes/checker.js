Jamlet.Checker = function(options) {
  this.model = options.model;
}

Jamlet.Checker.prototype = {
  timeBetweenChecks: 5*60*1000,
  lastError: null,
  lastResponse: null,

  start: function() {
    this.check(true);
  },

  check: function(reschedule) {
    this.model.fetch({
      success: function(_, response) {
        this.lastResponse = response;
      }.bind(this)
    });

    if (reschedule) {
      window.setTimeout(function() {
        this.check(true);
      }.bind(this), this.timeBetweenChecks);
    }
  }
};
