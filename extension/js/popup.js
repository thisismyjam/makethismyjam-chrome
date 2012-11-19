Jamlet = chrome.extension.getBackgroundPage().Jamlet;

Popup = {
  status: 'initial',

  init: function() {
    this.element = document.getElementById('popup');
    this.fetchHomeFeed();
  },

  fetchHomeFeed: function() {
    this.setStatus('fetchingHomeFeed');

    Jamlet.fetchHomeFeed(function(error, response) {
      if (error) {
        if (error.status === 401) {
          this.setStatus('unauthenticated');
        } else {
          this.lastError = error;
          this.setStatus('error');
        }
      } else {
        this.homeFeed = response;
        this.setStatus('homeFeed');
      }
    }.bind(this));
  },

  setStatus: function(status) {
    this.status = status;
    this.onChangeStatus();
  },

  onChangeStatus: function() {
    switch (this.status) {
      case 'fetchingHomeFeed':
        var spinnerElement = document.createElement('div');
        spinnerElement.className = 'spinner-container';
        this.element.appendChild(spinnerElement);

        var spinner = new Spinner();
        spinner.spin(spinnerElement);

        break;

      case 'homeFeed':
        this.element.innerHTML = 'There are ' + this.homeFeed.jams.length + ' jams in your home feed.';
        break;

      case 'unauthenticated':
        $(this.element)
          .html('You need to <a href="#">sign in</a>.')
          .find('a').click(function() {
            chrome.tabs.create({url: Jamlet.baseWebURL});
          });

        break;

      case 'error':
        $(this.element).text('Tragically, there was an HTTP ' + this.lastError.status + ' error. Sorry.');
        break;
    }
  }
};

Popup.init();
