import {noop} from 'lodash';

module.exports = function(delegate) {

  let on = delegate.on.bind(delegate);

  delegate.on = function(name, fn) {
    fn = fn || noop;
    on(name, fn.bind(delegate, name));
  };
  return delegate;
};
