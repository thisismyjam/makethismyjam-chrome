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
    // TODO: handle timeout
    this.model.fetch(function(error, response) {
      this.lastError    = error;
      this.lastResponse = response;

      if (reschedule) {
        window.setTimeout(function() {
          this.check(true);
        }.bind(this), this.timeBetweenChecks);
      }
    }.bind(this));
  }
};
