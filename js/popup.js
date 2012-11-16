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
        if (error.status === 401) {
          $(this.element)
            .html('You need to <a href="#">sign in</a>.')
            .find('a').click(function() {
              chrome.tabs.create({url: Jamlet.baseWebURL});
            });
        } else {
          $(this.element).text('Tragically, there was an HTTP ' + error.status + ' error. Sorry.');
        }
      } else {
        this.element.innerHTML = 'There are ' + response.jams.length + ' jams in your home feed.';
      }
    }.bind(this));
  }
};

Popup.init();
