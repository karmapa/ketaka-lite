
module.exports = function(fn) {

  return function(name, event, args) {

    this.send = function(data) {
      data = data || {};
      event.sender.send(name, data);
    };

    this.error = function(data) {
      data.error = true;
      this.send(data);
    };

    this.broadcast = event.sender.send.bind(event.sender);

    fn.call(this, event, args);
  };
};
