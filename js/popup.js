Jamlet = chrome.extension.getBackgroundPage().Jamlet;

Popup = {
  init: function() {
    this.element = document.getElementById('popup');

    var spinnerElement = document.createElement('div');
    spinnerElement.className = 'spinner-container';
    this.element.appendChild(spinnerElement);

    var spinner = new Spinner();
    spinner.spin(spinnerElement);

    Jamlet.fetchHomeFeed(function(error, response) {
      if (error) {
        this.element.innerHTML = 'There was an error.';
      } else {
        this.element.innerHTML = 'There are ' + response.jams.length + ' jams in your home feed.';
      }
    }.bind(this));
  }
};

Popup.init();
