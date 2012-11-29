Jamlet.CreateJam = Backbone.Model.extend({
  createJamURL: null,

  initialize: function(options) {
    this.api = options.api;
    this.browser = options.browser;

    this.browser.onTabActivated(this.tabActivated.bind(this));
  },

  tabActivated: function(tab) {
    if (tab && this.isPotentiallyJammable(tab.url)) {
      this.set({
        jammable: true,
        url:   this.createJamURL(tab.url),
        title: this.mediaTitle(tab.url, tab.title),
        type:  this.mediaType(tab.url)
      });
    } else {
      this.set({jammable: false, url: null, title: null, type: null});
    }
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

      case 'vimeo':
        return title.replace(/\s+(on\s+)?vimeo\b.*/i, '');

      case 'officialfm':
        return title.replace(/\s+(on\s+)?official\.fm\b.*/i, '');

      case 'soundcloud':
        return title.replace(/\s+(on\s+)?soundcloud\b.*/i, '');

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

    // Vimeo video page
    if (url.match(/^(https?:\/\/)?(www\.)?vimeo.com\/(.+\/)?([0-9]+)($|\?|#)/i))
      return 'vimeo';

    // Official.fm track page
    if (url.match(/^(https?:\/\/)?(www\.)?official\.fm\/tracks\/.+(\?|#|\/|$)/))
      return 'officialfm';
    
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

