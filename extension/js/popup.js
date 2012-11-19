Jamlet = chrome.extension.getBackgroundPage().Jamlet;

Popup = {
  init: function() {
    this.element = document.getElementById('popup');
    
    this.createJam = new CreateJam({element: $("<div/>").addClass("create-jam").appendTo(this.element)});
    this.createJam.render();
    this.createJam.fetch();

    this.homeFeed = new HomeFeed({element: $("<div/>").addClass("home-feed").appendTo(this.element)});
    this.homeFeed.render();
    this.homeFeed.fetch();
  }
};

function CreateJam(options) {
  this.element = $(options.element);
}

CreateJam.prototype = {
  createJamURL: null,

  fetch: function() {
    Jamlet.fetchCurrentTabIsJammable(function(url) {
      if (url) {
        this.setCreateJamURL(url);
      }
    }.bind(this));
  },

  setCreateJamURL: function(url) {
    this.createJamURL = url;
    this.render();
  },

  render: function() {
    if (this.createJamURL) {
      var url = this.createJamURL;

      var button = $("<button/>")
        .text("Make this my jam")
        .click(function() { chrome.tabs.create({url: url}) });

      this.element.show().append(button);
    } else {
      this.element.hide();
    }
  }
}

function HomeFeed(options) {
  this.element = $(options.element);
}

HomeFeed.prototype = {
  status: 'initial',
  homeFeed: null,

  fetch: function() {
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
    var spinnerElement = document.createElement('div');
    spinnerElement.className = 'spinner-container';
    this.element.append(spinnerElement);

    var spinner = new Spinner();
    spinner.spin(spinnerElement);
  },

  renderHomeFeed: function() {
    var element = this.element;

    $.each(this.homeFeed.jams, function() {
      var jam = this;
      var item = $("<div/>").addClass('jam');

      $("<div/>").addClass("jamvatar").append($("<img/>").attr("src", jam.jamvatarSmall)).appendTo(item);

      var info = $("<div/>").addClass('info').appendTo(item);
      $("<div/>").addClass("title").text(jam.title).appendTo(info);
      $("<div/>").addClass("artist").text(jam.artist).appendTo(info);
      $("<div/>").addClass("username").text('@' + jam.from).appendTo(info);

      item.click(function() { chrome.tabs.create({url: jam.url}); });
      item.appendTo(element);
    });
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
  }
};

Popup.init();
