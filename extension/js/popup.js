Popup = Backbone.Model.extend({
  initialize: function(options) {
    this.api     = options.api;
    this.browser = options.browser;

    this.set({status: 'initial'});

    this.createJam  = new CreateJam({api: this.api, browser: this.browser});
    this.currentJam = new CurrentJam({api: this.api});
    this.homeFeed   = Jamlet.HomeFeed;
  },

  fetch: function() {
    this.set({status: 'authenticating'});

    this.api.authenticate(function(error, credentials) {
      if (error) {
        this.set({status: 'unauthenticated'});
      } else {
        this.createJam.fetch();
        this.currentJam.fetch();
        this.homeFeed.fetch();

        this.set({status: 'available'});
      }
    }.bind(this));
  }
});

CreateJam = Backbone.Model.extend({
  createJamURL: null,

  initialize: function(options) {
    this.api = options.api;
    this.browser = options.browser;
  },

  fetch: function() {
    this.browser.fetchCurrentTabURL(function(url) {
      if (url && this.isPotentiallyJammable(url)) {
        this.set('url', this.makeCreateJamURL(url));
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
  }
});

CurrentJam = Backbone.Model.extend({
  initialize: function(options) {
    this.api = options.api;
    this.set({status: 'initial'});
  },

  fetch: function() {
    this.set({status: 'fetching'});

    this.api.fetchCurrentJam(function(error, response) {
      if (this.get('status') !== 'fetching') return; // we've moved on

      if (error) {
        this.set({status: 'error', lastError: error});
      } else {
        this.set(response.jam);
        this.set({status: 'available'});
      }
    }.bind(this));
  }
});

PopupView = Backbone.View.extend({
  initialize: function(options) {
    this.browser = options.browser;

    ["authenticating", "unauthenticated", "available"].forEach(function(className) {
      $("<div/>").addClass(className).appendTo(this.el);
    }.bind(this));

    this.loading    = this.addComponent(LoadingView,    ".authenticating");
    this.signIn     = this.addComponent(SignInView,     ".unauthenticated");

    this.createJam  = this.addComponent(CreateJamView,  ".available", {model: this.model.createJam});
    this.currentJam = this.addComponent(CurrentJamView, ".available", {model: this.model.currentJam});
    this.homeFeed   = this.addComponent(HomeFeedView,   ".available", {model: this.model.homeFeed});

    this.model.on("change", this.render, this);
  },

  render: function() {
    $(this.el).children().hide();
    $(this.el).children("." + this.model.get('status')).show();
  },

  addComponent: function(componentClass, appendToSelector, options) {
    options = options || {};

    _.extend(options, {
      el: $("<div/>").appendTo(this.$(appendToSelector)),
      browser: this.browser
    });

    var component = new componentClass(options);
    component.render();
    return component;
  }
});

LoadingView = Backbone.View.extend({
  render: function() {
    $(this.el).addClass('loading').empty();
    new Spinner().spin(this.el);
  }
});

SignInView = Backbone.View.extend({
  events: {
    "click a": "openSignInPage"
  },

  initialize: function(options) {
    this.browser = options.browser
  },

  render: function() {
    $(this.el).addClass('sign-in').html('You need to <a href="#">sign in</a>.');
  },

  openSignInPage: function() {
    this.browser.createTab({url: this.api.baseWebURL});
  }
});

CreateJamView = Backbone.View.extend({
  events: {
    "click button": "openCreateJamPage"
  },

  initialize: function(options) {
    this.browser = options.browser;
    this.model.on("change", this.render, this);
  },

  render: function() {
    console.log("this.model", this.model);
    console.log("this.model.get('url')", this.model.get('url'));

    $(this.el)
      .addClass('create-jam')
      .html("<button>Make this my jam</button>")
      .toggle(_.isString(this.model.get('url')));
  },

  openCreateJamPage: function() {
    this.browser.createTab({url: this.model.get('url')});
  }
});

CurrentJamView = Backbone.View.extend({
  events: {
    "click": "openJam"
  },

  initialize: function(options) {
    this.browser = options.browser;
    this.model.on("change", this.render, this);
  },

  render: function() {
    var jam    = this.model;
    var status = this.model.get('status');

    $(this.el)
      .addClass('current-jam')
      .empty()
      .attr("data-status", status);

    if (status === 'available') {
      $("<div/>").addClass("title").text(jam.get('title')).appendTo(this.el);
      $("<div/>").addClass("artist").text(jam.get('artist')).appendTo(this.el);

      if (jam.get('playCount')     > 0) $("<div/>").addClass("play-count").text(jam.get('playCount')).appendTo(this.el);
      if (jam.get('likesCount')    > 0) $("<div/>").addClass("likes-count").text(jam.get('likesCount')).appendTo(this.el);
      if (jam.get('commentsCount') > 0) $("<div/>").addClass("comments-count").text(jam.get('commentsCount')).appendTo(this.el);
    }
  },

  openJam: function() {
    if (this.model.get('url')) {
      this.browser.createTab({url: this.model.get('url')});
    }
  }
});

HomeFeedView = Backbone.View.extend({
  initialize: function(options) {
    this.browser = options.browser;
    this.model.on("change", this.render, this);
  },

  render: function() {
    var element = this.el;
    var browser = this.browser;

    $(element)
      .addClass('home-feed')
      .empty()
      .toggle(this.model.models.length > 0);

    _.each(this.model.models, function(jam) {
      var item = $("<div/>").addClass('jam');

      $("<div/>").addClass("jamvatar").append($("<img/>").attr("src", jam.get('jamvatarSmall'))).appendTo(item);

      var info = $("<div/>").addClass('info').appendTo(item);
      $("<div/>").addClass("title").text(jam.get('title')).appendTo(info);
      $("<div/>").addClass("artist").text(jam.get('artist')).appendTo(info);
      $("<div/>").addClass("username").text('@' + jam.get('from')).appendTo(info);

      item.click(function() { browser.createTab({url: jam.get('url')}); });
      item.appendTo(element);
    });
  }
});

var Jamlet = chrome.extension.getBackgroundPage().Jamlet;

Jamlet.lastOpenedPopup = new Date();

var popup = new Popup({
  api:     Jamlet.API,
  browser: Jamlet.Browser
});

var popupView = new PopupView({
  el:      $('#popup'),
  model:   popup,
  browser: Jamlet.Browser
})

popupView.render();
popup.fetch();
