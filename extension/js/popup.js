Popup = {
  init: function(options) {
    this.element = options.element;
    this.api     = options.api;
    this.browser = options.browser;
    
    this.createJam = new CreateJam({
      element: $("<div/>").addClass("create-jam").appendTo(this.element),
      browser: options.browser
    });

    this.createJam.render();
    this.createJam.fetch();

    this.homeFeed = new HomeFeed({
      element: $("<div/>").addClass("home-feed").appendTo(this.element),
      api:     options.api,
      browser: options.browser
    });

    this.homeFeed.render();
    this.homeFeed.fetch();
  }
};

function CreateJam(options) {
  this.element = $(options.element);
  this.browser = options.browser;
}

CreateJam.prototype = {
  createJamURL: null,

  fetch: function() {
    this.browser.fetchCurrentTabURL(function(url) {
      if (url && this.isPotentiallyJammable(url)) {
        this.setCreateJamURL(this.makeCreateJamURL(url));
      }
    }.bind(this));
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
  },

  makeCreateJamURL: function(url) {
    return 'http://www.thisismyjam.com/jam/create?signin=1&source=jamlet&url=' + encodeURIComponent(url);
  },

  setCreateJamURL: function(url) {
    this.createJamURL = url;
    this.render();
  },

  render: function() {
    if (this.createJamURL) {
      var url = this.createJamURL;
      var browser = this.browser;

      var button = $("<button/>")
        .text("Make this my jam")
        .click(function() { browser.createTab({url: url}) });

      this.element.show().append(button);
    } else {
      this.element.hide();
    }
  }
}

function HomeFeed(options) {
  this.element = $(options.element);
  this.api     = options.api;
  this.browser = options.browser;
}

HomeFeed.prototype = {
  status: 'initial',
  homeFeed: null,

  fetch: function() {
    this.setStatus('fetchingHomeFeed');

    this.api.fetchHomeFeed(function(error, response) {
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

  setStatus: function(status) {
    this.status = status;
    this.render();
  },

  render: function() {
    this.element.toggle(this.status !== 'initial');
    this.element.empty();

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

  renderSpinner: function() {
    var spinnerElement = $('<div/>').addClass('spinner-container').get(0);
    var spinner = new Spinner();

    this.element.append(spinnerElement);
    spinner.spin(spinnerElement);
  },

  renderHomeFeed: function() {
    var element = this.element;
    var browser = this.browser;

    $.each(this.homeFeed.jams, function() {
      var jam = this;
      var item = $("<div/>").addClass('jam');

      $("<div/>").addClass("jamvatar").append($("<img/>").attr("src", jam.jamvatarSmall)).appendTo(item);

      var info = $("<div/>").addClass('info').appendTo(item);
      $("<div/>").addClass("title").text(jam.title).appendTo(info);
      $("<div/>").addClass("artist").text(jam.artist).appendTo(info);
      $("<div/>").addClass("username").text('@' + jam.from).appendTo(info);

      item.click(function() { browser.createTab({url: jam.url}); });
      item.appendTo(element);
    });
  },

  renderSignInLink: function() {
    var browser = this.browser;

    $("<div/>")
      .addClass("sign-in")
      .html('You need to <a href="#">sign in</a>.')
      .find('a').click(function() {
        browser.createTab({url: this.api.baseWebURL});
      })
      .appendTo(this.element);
  },

  renderError: function() {
    $("<div/>")
      .addClass("error")
      .text('Tragically, there was an HTTP ' + this.lastError.status + ' error. Sorry.')
      .appendTo(this.element);
  }
};

var Jamlet = chrome.extension.getBackgroundPage().Jamlet;

Popup.init({
  element: $('#popup'),
  api:     Jamlet.API,
  browser: Jamlet.Browser
});
