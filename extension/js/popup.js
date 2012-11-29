Popup = Backbone.Model.extend({
  initialize: function(options) {
    this.api     = options.api;
    this.browser = options.browser;

    this.set({status: 'initial'});

    this.createJam  = options.createJam;
    this.currentJam = new CurrentJam({api: this.api});
    this.homeFeed   = options.homeFeed;
  },

  fetch: function() {
    this.set({status: 'authenticating'});

    this.createJam.refreshCurrentTab();

    this.api.authenticate(function(error, credentials) {
      if (error) {
        this.set({status: 'unauthenticated'});
      } else {
        this.currentJam.fetch();
        this.set({status: 'available'});
      }
    }.bind(this));
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
  initialize: function(options) {
    this.browser = options.browser;
    this.api = options.api;
  },

  render: function() {
    $(this.el).addClass('sign-in').html('You need to <a href="' + this.api.baseWebURL + '">sign in</a>.');
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
      .attr('data-jammable', this.isJammable());

    if (this.isJammable()) {
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
    if (this.isJammable()) {
      this.browser.createTab({url: this.model.get('url')});
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

  hasJam: function() {
    return _.isString(this.model.get('title'));
  }
});

HomeFeedView = Backbone.View.extend({
  initialize: function(options) {
    this.browser = options.browser;
    this.api = options.api;
    this.model.bind("reset", this.render, this);
  },

  render: function() {
    var element = this.el;
    var browser = this.browser;

    $(element)
      .addClass('home-feed')
      .empty();

    if (this.model.models.length === 0) {
      $(this.el).html("<div class='no-jams'>No jams from people you follow. Why not <a href='" + this.api.baseWebURL + "/suggestions'>find more people to get music from?</a></div>");
    }

    _.each(this.model.models, function(model) {
      var jam = model.toJSON();
      var item = $("<div/>").addClass('jam').attr('data-seen', String(jam.seen));

      $("<div/>").addClass("jamvatar").append($("<img/>").attr("src", jam.jamvatarSmall)).appendTo(item);
      $("<div/>").addClass("timestamp").text(formatTimestamp(jam.creationDate)).appendTo(item);

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

(function() {
  var popupElement = $('#popup');
  var globals = chrome.extension.getBackgroundPage().Jamlet.globals;

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

  globals.lastOpenedPopup.updateTimestamp();

  globals.popup = popup;
  globals.popupView = popupView;

  popupElement.on('click', 'a', function(event) {
    globals.browser.createTab({url: event.target.href});
  });
})();
