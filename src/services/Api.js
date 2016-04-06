let ipc = window.require('electron').ipcRenderer;

export default class Api {

  static send(name, args = {}) {
    return new Promise((resolve, reject) => {
      this.initEvent(name, resolve, reject);
      ipc.send(name, args);
    });
  }

  static initEvent(name, resolve, reject) {

    ipc.once(name, function(event, data) {

      if (data.error) {
        reject(data);
      }
      else {
        resolve(data);
      }
    });
  }

  static on = ipc.on.bind(ipc);

  static off = ipc.removeListener.bind(ipc);
}
