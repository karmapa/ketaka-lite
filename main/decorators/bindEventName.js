
module.exports = function(delegate) {

  var on = delegate.on.bind(delegate);

  delegate.on = function(name, fn) {
    fn = fn || _.noop;
    on(name, fn.bind(delegate, name));
  };
  return delegate;
};
