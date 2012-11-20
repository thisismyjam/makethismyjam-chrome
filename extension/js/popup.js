function Component(options) {
  this.options = options;

  this.element = $(options.element);
  this.api     = options.api;
  this.browser = options.browser;

  this.initialize(options);
}

Component.extend = function(extensions) {
  var klass = function(options) {
    Component.call(this, options);
  };

  klass.prototype = Object.create(Component.prototype);

  for (var key in extensions)
    if (extensions.hasOwnProperty(key))
      klass.prototype[key] = extensions[key];

  return klass;
}

Component.prototype = {
  initialize: function(options) {}
}

Popup = Component.extend({
  initialize: function(options) {
    this.addComponent(CreateJam,  "create-jam");
    this.addComponent(CurrentJam, "current-jam");
    this.addComponent(HomeFeed,   "home-feed");
  },

  addComponent: function(componentClass, cssClass) {
    var component = new componentClass({
      element: $("<div/>").addClass(cssClass).appendTo(this.element),
      api:     this.options.api,
      browser: this.options.browser
    });

    component.render();
    component.fetch();

    return component;
  }
});

CreateJam = Component.extend({
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
    return this.api.baseWebURL + '/jam/create?signin=1&source=jamlet&url=' + encodeURIComponent(url);
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
});

CurrentJam = Component.extend({
  status: 'initial',
  jam: null,

  initialize: function(options) {
    this.element.click(function() {
      if (this.jam) {
        this.browser.createTab({url: this.jam.url});
      }
    }.bind(this));
  },

  fetch: function() {
    this.setStatus('fetching');

    this.api.fetchCurrentJam(function(error, response) {
      if (this.status !== 'fetching') return; // we've moved on

      if (error) {
        if (error.status === 401) {
          this.setStatus('unauthenticated');
        } else {
          this.lastError = error;
          this.setStatus('error');
        }
      } else {
        this.jam = response.jam;
        this.setStatus('available');
      }
    }.bind(this));
  },

  setStatus: function(status) {
    this.status = status;
    this.render();
  },

  render: function() {
    this.element
      .empty()
      .attr("data-status", this.status);

    if (this.status === 'available') {
      $("<div/>").addClass("title").text(this.jam.title).appendTo(this.element);
      $("<div/>").addClass("artist").text(this.jam.artist).appendTo(this.element);

      if (this.jam.playCount     > 0) $("<div/>").addClass("play-count").text(this.jam.playCount).appendTo(this.element);
      if (this.jam.likesCount    > 0) $("<div/>").addClass("likes-count").text(this.jam.likesCount).appendTo(this.element);
      if (this.jam.commentsCount > 0) $("<div/>").addClass("comments-count").text(this.jam.commentsCount).appendTo(this.element);
    }
  }
});

HomeFeed = Component.extend({
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
});

var Jamlet = chrome.extension.getBackgroundPage().Jamlet;

new Popup({
  element: $('#popup'),
  api:     Jamlet.API,
  browser: Jamlet.Browser
});
