Jamlet.Checker = function(options) {
  this.options  = options;
  this.checkFn  = options.checkFn;
  this.callback = options.callback;
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
    this.checkFn(function(error, response) {
      this.lastError    = error;
      this.lastResponse = response;

      if (this.callback) this.callback(error, response);

      if (reschedule) {
        window.setTimeout(function() {
          this.check(true);
        }.bind(this), this.timeBetweenChecks);
      }
    }.bind(this));
  }
};
