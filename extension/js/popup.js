Jamlet = chrome.extension.getBackgroundPage().Jamlet;

Popup = {
  status: 'initial',

  init: function() {
    this.element = document.getElementById('popup');
    this.fetchCurrentTabIsJammable();
    this.fetchHomeFeed();
  },

  fetchCurrentTabIsJammable: function() {
    Jamlet.fetchCurrentTabIsJammable(function(url) {
      if (url) {
        this.setCreateJamURL(url);
      }
    }.bind(this));
  },

  fetchHomeFeed: function() {
    this.setStatus('fetchingHomeFeed');

    Jamlet.fetchHomeFeed(function(error, response) {
      if (this.status !== 'fetchingHomeFeed') return; // we've moved on

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

  setCreateJamURL: function(url) {
    this.createJamURL = url;
    this.render();
  },

  setStatus: function(status) {
    this.status = status;
    this.render();
  },

  render: function() {
    $(this.element).empty();

    if (this.createJamURL)
      this.renderJamButton();

    switch (this.status) {
      case 'fetchingHomeFeed':
        this.renderSpinner();
        break;
      case 'homeFeed':
        this.renderHomeFeed();
        break;
      case 'unauthenticated':
        this.renderSignInLink();
        break;
      case 'error':
        this.renderError();
        break;
    }
  },

  renderJamButton: function() {
    var url = this.createJamURL;
    var container = $("<div/>").addClass("create-jam");
    var button = $("<button/>")
      .text("Make this my jam")
      .click(function() { chrome.tabs.create({url: url}) });

    button.appendTo(container);
    container.appendTo(this.element);
  },

  renderSpinner: function() {
    var spinnerElement = document.createElement('div');
    spinnerElement.className = 'spinner-container';
    this.element.appendChild(spinnerElement);

    var spinner = new Spinner();
    spinner.spin(spinnerElement);
  },

  renderHomeFeed: function() {
    var items = $("<div/>").addClass("home-feed");

    $.each(this.homeFeed.jams, function() {
      var jam = this;
      var item = $("<div/>").addClass('jam');

      $("<div/>").addClass("jamvatar").append($("<img/>").attr("src", jam.jamvatarSmall)).appendTo(item);

      var info = $("<div/>").addClass('info').appendTo(item);
      $("<div/>").addClass("title").text(jam.title).appendTo(info);
      $("<div/>").addClass("artist").text(jam.artist).appendTo(info);
      $("<div/>").addClass("username").text('@' + jam.from).appendTo(info);

      item.click(function() { chrome.tabs.create({url: jam.url}); });
      item.appendTo(items);
    });

    this.$(".home-feed").remove();
    $(this.element).append(items);
  },

  renderSignInLink: function() {
    $("<div/>")
      .addClass("sign-in")
      .html('You need to <a href="#">sign in</a>.')
      .find('a').click(function() {
        chrome.tabs.create({url: Jamlet.baseWebURL});
      })
      .appendTo(this.element);
  },

  renderError: function() {
    $("<div/>")
      .addClass("error")
      .text('Tragically, there was an HTTP ' + this.lastError.status + ' error. Sorry.')
      .appendTo(this.element);
  },

  $: function(selector) {
    return $(selector, this.element);
  }
};

Popup.init();
