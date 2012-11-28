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
    this.browser.fetchCurrentTab(function(tab) {
      if (tab && this.isPotentiallyJammable(tab.url)) {
        this.set({
          url:   this.createJamURL(tab.url),
          title: this.mediaTitle(tab.url, tab.title),
          type:  this.mediaType(tab.url)
        });
      }
    }.bind(this));
  },

  isPotentiallyJammable: function(url) {
    return this.mediaSource(url) !== null;
  },

  createJamURL: function(url) {
    return this.api.baseWebURL + '/jam/create?signin=1&source=jamlet&url=' + encodeURIComponent(url);
  },

  mediaTitle: function(url, title) {
    switch (this.mediaSource(url)) {
      case 'youtube':
        return title.replace(/\s+-\s+youtube\b.*/i, '');

      case 'soundcloud':
        return title.replace(/\s+(on\s+)?soundcloud\s+.*/i, '');

      case 'found':
        return (title.match(/[^\/]+$/) || [title])[0];

      case 'hypemachine':
        return title.replace(/(,[a-z ]+)?\/\s+the\s+hype\s+machine.*/i, '');

      default:
        return title;
    }
  },

  mediaType: function(url) {
    switch (this.mediaSource(url)) {
      case 'youtube':
      case 'vimeo':
        return 'video';

      default:
        return 'audio';
    }
  },

  mediaSource: function(url) {
    // YouTube watch page
    if (url.match(/^(https?:\/\/)?(www\.)?youtube\.com\/watch.+/i))
      return 'youtube';
    
    // Potential SoundCloud track page (TODO: Introspect page to make sure?)
    if (url.match(/^(https?:\/\/)?(www\.)?soundcloud\.com\/[^\/]+\/[^\/]+/i))
      return 'soundcloud';
    
    // Found audio
    if (url.match(/^[^ ]+\/[^ ]+\.mp3$/))
      return 'found';
    
    // Hype Machine track page
    if (url.match(/^(https?:\/\/)?(www\.)?hypem.com\/track\/[^\/]+/i))
      return 'hypemachine';
    
    // Potential Bandcamp track page (TODO: Introspect page to make sure?)
    if (url.match(/^(https?:\/\/)[^\/]+\/track\//))
      return 'bandcamp';

    return null;
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
    this.api = options.api;

    ["authenticating", "unauthenticated", "available"].forEach(function(className) {
      $("<div/>").addClass(className).appendTo(this.el);
    }.bind(this));

    this.loading    = this.addComponent(LoadingView,    ".authenticating");
    this.signIn     = this.addComponent(SignInView,     ".unauthenticated");

    this.createJam  = this.addComponent(CreateJamView,  ".available", {model: this.model.createJam});
    this.homeFeed   = this.addComponent(HomeFeedView,   ".available", {model: this.model.homeFeed});
    this.currentJam = this.addComponent(CurrentJamView, ".available", {model: this.model.currentJam});

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
      browser: this.browser,
      api: this.api
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
    $(this.el)
      .addClass('create-jam')
      .empty()
      .attr('data-has-url', this.hasURL());

    if (this.hasURL()) {
      var type = this.model.get('type');
      type = type[0].toUpperCase() + type.substring(1).toLowerCase();

      $("<button>Make this my jam</button>").appendTo(this.el);
      $("<div/>")
        .addClass('source')
        .text(type + " will be sourced from this page: \u201C" + this.model.get('title') + "\u201D")
        .appendTo(this.el);
    }
  },

  openCreateJamPage: function() {
    if (this.hasURL()) {
      this.browser.createTab({url: this.model.get('url')});
    }
  },

  hasURL: function() {
    return _.isString(this.model.get('url'));
  }
});

CurrentJamView = Backbone.View.extend({
  events: {
    "click":   "openJam",
    "click a": "openLink"
  },

  initialize: function(options) {
    this.browser = options.browser;
    this.api = options.api;
    this.model.on("change", this.render, this);
  },

  render: function() {
    var status = this.model.get('status');

    $(this.el)
      .addClass('current-jam')
      .empty()
      .attr("data-status", status)
      .attr("data-has-jam", String(this.hasJam()));

    if (status === 'available') {
      if (this.hasJam()) {
        var jam = this.model.toJSON();

        $("<div/>").addClass("jamvatar").append($("<img/>").attr("src", jam.jamvatarSmall)).appendTo(this.el);

        var info = $("<div/>").addClass("info").appendTo(this.el);

        $("<div/>").addClass("title").text("Your jam: " + jam.title + " by " + jam.artist).appendTo(info);

        var stats = $("<div/>").addClass("stats").appendTo(info);

        if (jam.playCount     > 0) $("<div/>").addClass("stat").addClass("play-count").text(jam.playCount).appendTo(stats);
        if (jam.likesCount    > 0) $("<div/>").addClass("stat").addClass("likes-count").text(jam.likesCount).appendTo(stats);
        if (jam.commentsCount > 0) $("<div/>").addClass("stat").addClass("comments-count").text(jam.commentsCount).appendTo(stats);
      } else {
        var createJamLink = $("<a/>").html("What&rsquo;s your favourite song right now?").attr('href', this.api.baseWebURL + '/jam/create');
        $("<div/>").append(createJamLink).appendTo(this.el);
        $("<div/>").text("Make it your jam and share it with your friends!").appendTo(this.el);
      }
    }
  },

  openJam: function() {
    if (this.hasJam()) {
      this.browser.createTab({url: this.model.get('url')});
    }
  },

  openLink: function(event) {
    this.browser.createTab({url: event.target.href});
  },

  hasJam: function() {
    return _.isString(this.model.get('title'));
  }
});

HomeFeedView = Backbone.View.extend({
  initialize: function(options) {
    this.browser = options.browser;
  },

  render: function() {
    var element = this.el;
    var browser = this.browser;

    $(element)
      .addClass('home-feed')
      .empty();

    if (this.model.models.length === 0) {
      $(this.el).html("<div class='no-jams'>No jams from people you follow. Why not find more people to get music from?</div>");
    }

    _.each(this.model.models, function(model) {
      var jam = model.toJSON();
      var item = $("<div/>").addClass('jam').attr('data-seen', String(jam.seen));

      $("<div/>").addClass("jamvatar").append($("<img/>").attr("src", jam.jamvatarSmall)).appendTo(item);
      $("<div/>").addClass("timestamp").text(formatTimestamp(jam.creationDate) + " ago").appendTo(item);

      var info = $("<div/>").addClass('info').appendTo(item);

      $("<div/>").addClass("user").text(jam.from + '\u2019s jam').appendTo(info);
      $("<div/>").addClass("song").text(jam.title + ' by ' + jam.artist).appendTo(info);

      item.click(function() { browser.createTab({url: jam.url}); });
      item.appendTo(element);
    });

    function formatTimestamp(dateString) {
      var duration = moment.duration(moment().diff(moment(dateString)));
      var days     = duration.days();

      if (days > 1) {
        return days + " days";
      } else if (days == 1) {
        return "1 day";
      } else {
        var components = [];
        var hours = duration.hours();
        var mins = duration.minutes();

        if (hours > 0) components.push(hours + "h");
        if (mins > 0)  components.push(mins + " min");

        if (components.length > 0) {
          return components.join(", ");
        } else {
          return "just now";
        }
      }
    }
  }
});

var Jamlet = chrome.extension.getBackgroundPage().Jamlet;

var popup = new Popup({
  api:     Jamlet.API,
  browser: Jamlet.Browser
});

var popupView = new PopupView({
  el:      $('#popup'),
  model:   popup,
  api:     Jamlet.API,
  browser: Jamlet.Browser,
})

popupView.render();
popup.fetch();

Jamlet.LastOpenedPopup.set({lastTimestamp: new Date()});
