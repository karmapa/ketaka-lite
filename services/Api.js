import _ from 'lodash';
import uuid from 'node-uuid';

let ipc = window.require('ipc');

export default class Api {

  static events = {};

  static send(name, args = {}) {
    return new Promise((resolve, reject) => {

      let id = uuid.v4();

      this.initEvent(name);
      this.events[name].push({id, resolve, reject});

      args.id = id;
      ipc.send(name, args);
    });
  }

  static initEvent(name) {
    let self = this;
    if (_.isUndefined(self.events[name])) {
      self.events[name] = [];
      ipc.on(name, function(res) {

        let event = _.find(self.events[name], {id: res.id});

        if (! event) {
          return;
        }
        if (res.error) {
          event.reject(res);
        }
        else {
          event.resolve(res);
        }
        delete self.events[name];
      });
    }
  }

  static on = ipc.on.bind(ipc);
}
