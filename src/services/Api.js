let ipc = window.require('ipc');

export default class Api {

  static events = {};

  static send(name, args = {}) {
    return new Promise((resolve, reject) => {
      this.initEvent(name, resolve, reject);
      ipc.send(name, args);
    });
  }

  static initEvent(name, resolve, reject) {

    ipc.once(name, function(res) {
      if (res.error) {
        reject(res);
      }
      else {
        resolve(res);
      }
    });
  }

  static on = ipc.on.bind(ipc);
}
