var Base = chrome.extension.getBackgroundPage().Base;

Component = Base.extend({
  initialize: function(options) {
    this.element = $(options.element);
    this.api     = options.api;
    this.browser = options.browser;

    if (this.cssClass) {
      this.element.addClass(this.cssClass);
    }
  },

  setStatus: function(status) {
    this.status = status;
    this.render();
  },

  $: function(selector) {
    return $(selector, this.element);
  }
});

Popup = Component.extend({
  status: 'initial',

  initialize: function(options) {
    Component.prototype.initialize.call(this, options);

    ["authenticating", "unauthenticated", "available"].forEach(function(cssClass) {
      $("<div/>").addClass(cssClass).appendTo(this.element);
    }.bind(this));

    this.loading    = this.addComponent(Loading,    ".authenticating");
    this.signIn     = this.addComponent(SignIn,     ".unauthenticated");

    this.createJam  = this.addComponent(CreateJam,  ".available");
    this.currentJam = this.addComponent(CurrentJam, ".available");
    this.homeFeed   = this.addComponent(HomeFeed,   ".available");
  },

  fetch: function() {
    this.setStatus('authenticating');

    this.api.authenticate(function(error, credentials) {
      if (error) {
        this.setStatus('unauthenticated');
      } else {
        this.createJam.fetch();
        this.currentJam.fetch();
        this.homeFeed.fetch();

        this.setStatus('available');
      }
    }.bind(this));
  },

  render: function() {
    this.element.children().hide();
    this.element.children("." + this.status).show();
  },

  addComponent: function(componentClass, appendToSelector) {
    var component = new componentClass({
      element: $("<div/>").appendTo(this.$(appendToSelector)),
      api:     this.options.api,
      browser: this.options.browser
    });

    component.render();

    return component;
  }
});

Loading = Component.extend({
  cssClass: 'loading',

  render: function() {
    this.element.empty();
    new Spinner().spin(this.element.get(0));
  }
});

SignIn = Component.extend({
  cssClass: 'sign-in',

  render: function() {
    var browser   = this.browser;
    var signInURL = this.api.baseWebURL;

    this.element.html('You need to <a href="#">sign in</a>.');

    this.$('a').click(function() {
      browser.createTab({url: signInURL});
    });
  }
});

CreateJam = Component.extend({
  cssClass: 'create-jam',
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
  cssClass: 'current-jam',
  status: 'initial',
  jam: null,

  initialize: function(options) {
    Component.prototype.initialize.call(this, options);

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
        this.lastError = error;
        this.setStatus('error');
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
  cssClass: 'home-feed',
  status: 'initial',
  homeFeed: null,

  fetch: function() {
    this.setStatus('fetchingHomeFeed');

    this.api.fetchHomeFeed(function(error, response) {
      if (this.status !== 'fetchingHomeFeed') return; // we've moved on

      if (error) {
        this.lastError = error;
        this.setStatus('error');
      } else {
        this.homeFeed = response;
        this.setStatus('homeFeed');
      }
    }.bind(this));
  },

  render: function() {
    this.element.toggle(this.status !== 'initial');
    this.element.empty();

    switch (this.status) {
      case 'homeFeed':
        this.renderHomeFeed();
        break;
      case 'error':
        this.renderError();
        break;
    }
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

  renderError: function() {
    $("<div/>")
      .addClass("error")
      .text('Tragically, there was an HTTP ' + this.lastError.status + ' error. Sorry.')
      .appendTo(this.element);
  }
});

var Jamlet = chrome.extension.getBackgroundPage().Jamlet;

Jamlet.lastOpenedPopup = new Date();

var popup = new Popup({
  element: $('#popup'),
  api:     Jamlet.API,
  browser: Jamlet.Browser
});

popup.render();
popup.fetch();
