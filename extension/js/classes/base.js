function Base(options) {
  this.options = options;
  this.initialize(options);
}

Base.extend = function(extensions) {
  var superklass = this;

  var klass = function(options) {
    superklass.call(this, options);
  };

  klass.prototype = Object.create(superklass.prototype);
  klass.extend = superklass.extend;

  for (var key in extensions)
    if (extensions.hasOwnProperty(key))
      klass.prototype[key] = extensions[key];

  return klass;
}

Base.prototype = {
  initialize: function(options) {}
}

