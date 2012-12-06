Link = {
  withTracking: function(url, options) {
    options = options || {};

    var params = {
      utm_source: "jamlet",
      utm_medium: "click"
    };

    if (options.type)       params.utm_campaign = options.type;
    if (this.extensionVersion) params.utm_content  = this.extensionVersion;

    var pairs = _.pairs(params).map(function(pair) { return escape(pair[0]) + '=' + escape(pair[1]) });

    url += (url.match(/\?/)) ? '&' : '?';
    url += pairs.join('&');

    return url;
  }
};

Popup = Backbone.Model.extend({
  initialize: function(options) {
    this.api     = options.api;
    this.browser = options.browser;

    this.set({status: 'initial'});

    this.createJam  = options.createJam;
    this.currentUser = new CurrentUser();
    this.currentJam = new CurrentJam();
    this.homeFeed   = options.homeFeed;
  },

  fetch: function() {
    this.set({status: 'authenticating'});

    this.createJam.refreshCurrentTab();

    this.api.authenticate(function(error, credentials) {
      if (error) {
        this.set({status: 'unauthenticated'});
      } else {
        if (!this.homeFeed.hasLoadedOnce()) {
          this.homeFeed.fetch();
        }

        this.api.fetchCurrentJam(function(error, response) {
          if (error) {
            // ignore error for now
          } else {
            this.currentUser.set(response.person);

            var jamAttributes = {hasJam: (!!response.jam), status: 'available'};
            _.extend(jamAttributes, response.jam);
            this.currentJam.set(jamAttributes);
          }
        }.bind(this));

        this.set({status: 'available'});
      }
    }.bind(this));
  }
});

CurrentUser = Backbone.Model.extend({});
CurrentJam = Backbone.Model.extend({status: 'initial'});

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
    this.homeFeed   = this.addComponent(HomeFeedView,   ".available", {model: this.model.homeFeed, currentUser: this.model.currentUser});
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
  initialize: function(options) {
    this.browser = options.browser;
    this.api = options.api;
  },

  render: function() {
    var signInURL = Link.withTracking(this.api.baseWebURL + '?signin=1', {type: 'signedOut'});
    var aboutURL  = Link.withTracking(this.api.baseWebURL + '/jamlet', {type: 'signedOut'});
    var extensionURL = 'https://chrome.google.com/webstore/detail/jamlet/cdakbflgliddhhegidnfmcgbgpelgknk';

    $(this.el)
      .addClass('sign-in')
      .append('<p><b>Post music to This Is My Jam</b> and be notified when people you follow post new songs to listen to! <a href="' + aboutURL + '">Learn More &raquo;</a></p>')
      .append('<a class="button" href="' + signInURL + '">Sign in to start using Jamlet</a>')
      .append('<a href="' + extensionURL + '" class="ribbon">v0.2</a>');
  }
});

CreateJamView = Backbone.View.extend({
  initialize: function(options) {
    this.browser = options.browser;
  },

  render: function() {
    $(this.el)
      .addClass('create-jam')
      .empty()
      .attr('data-jammable', this.isJammable());

    if (this.isJammable()) {
      var type = this.model.get('type');
      type = type[0].toUpperCase() + type.substring(1).toLowerCase();

      var url = Link.withTracking(this.model.get('url'), {type: 'makeThisMyJam'});

      $("<a class='button' href='" + url + "'>Make this my jam</button>").appendTo(this.el);
      $("<div/>")
        .addClass('source')
        .text(type + " will be sourced from this page: \u201C" + this.model.get('title') + "\u201D")
        .appendTo(this.el);
    }
  },

  isJammable: function() {
    return this.model.get('jammable');
  }
});

CurrentJamView = Backbone.View.extend({
  events: {
    "click":   "openJam"
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
        var createJamURL = Link.withTracking(this.api.baseWebURL + '/jam/create', {type: 'noCurrentJam'});
        var createJamLink = $("<a/>").html("What&rsquo;s your favourite song right now?").attr('href', createJamURL);
        $("<div/>").append(createJamLink).appendTo(this.el);
        $("<div/>").text("Make it your jam and share it with your friends!").appendTo(this.el);
      }
    }
  },

  openJam: function() {
    if (this.hasJam()) {
      var url = Link.withTracking(this.model.get('url'), {type: 'currentJam'});
      this.browser.createTab({url: url});
    }
  },

  hasJam: function() {
    return this.model.get('hasJam');
  }
});

HomeFeedView = Backbone.View.extend({
  initialize: function(options) {
    this.browser = options.browser;
    this.api = options.api;
    this.currentUser = options.currentUser;
    this.model.bind("reset", this.render, this);
  },

  render: function() {
    var element = this.el;
    var browser = this.browser;

    $(element)
      .addClass('home-feed')
      .empty();

    if (!this.model.hasLoadedOnce()) {
      return;
    }

    if (this.model.models.length === 0) {
      var suggestionsURL = Link.withTracking(this.api.baseWebURL + "/suggestions", {type: 'noJams'});

      if (this.currentUser.get('followingCount') > 0) {
        $(this.el).html("<div class='no-jams'>No jams from people you follow. Why not <a href='" + suggestionsURL + "'>find more people to get music from?</a></div>");
      } else {
        $(this.el).html("<div class='no-jams'><a href='" + suggestionsURL + "'>Follow some people</a> whose music you like, and their jams will appear here!</div>");
      }
    }

    _.each(this.model.models, function(model) {
      var jam = model.toJSON();
      var item = $("<div/>").addClass('jam').attr('data-seen', String(jam.seen));

      $("<div/>").addClass("jamvatar").append($("<img/>").attr("src", jam.jamvatarSmall)).appendTo(item);
      $("<div/>").addClass("timestamp").text(formatTimestamp(jam.creationDate)).appendTo(item);

      var info = $("<div/>").addClass('info').appendTo(item);

      $("<div/>").addClass("user").text(jam.from + '\u2019s jam').appendTo(info);
      $("<div/>").addClass("song").text(jam.title + ' by ' + jam.artist).appendTo(info);

      var url = Link.withTracking(jam.url, {type: 'homeFeedJam'});
      item.click(function() { browser.createTab({url: url}); });

      item.appendTo(element);
    });

    function formatTimestamp(dateString) {
      var duration = moment.duration(moment().diff(moment(dateString)));
      var days     = duration.days();

      if (days > 1) {
        return days + " days ago";
      } else if (days == 1) {
        return "1 day ago";
      } else {
        var components = [];
        var hours = duration.hours();
        var mins = duration.minutes();

        if (hours > 0) components.push(hours + "h");
        if (mins > 0)  components.push(mins + " min");

        if (components.length > 0) {
          return components.join(", ") + " ago";
        } else {
          return "just now";
        }
      }
    }
  }
});

initPopup = function() {
  var popupElement = $('<div id="popup"/>');
  var globals = chrome.extension.getBackgroundPage().Jamlet.globals;

  Link.extensionVersion = globals.extensionVersion;

  var popup = new Popup({
    api:       globals.api,
    browser:   globals.browser,
    createJam: globals.createJam,
    homeFeed:  globals.homeFeed
  });

  var popupView = new PopupView({
    el:      popupElement,
    model:   popup,
    api:     globals.api,
    browser: globals.browser,
  });

  popupView.render();
  popup.fetch();

  globals.lastSawHomeFeed.updateTimestamp();

  globals.popup = popup;
  globals.popupView = popupView;

  popupElement.on('click', 'a', function(event) {
    globals.browser.createTab({url: event.target.href});
  });

  popupElement.appendTo(document.body);
};

setTimeout(initPopup, 0);
