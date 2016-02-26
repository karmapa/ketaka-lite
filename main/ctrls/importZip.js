import _ from 'lodash';
import {Importer} from '../services';
import {dialog} from 'electron';
import {ipcHandler} from '../decorators';

let importZip = ipcHandler(function(event, args) {

  let send = this.send;
  let broadcast = this.broadcast;
  let options = {
    properties: ['openFile'],
    filters: [
      {name: 'zip', extensions: ['zip']}
    ]
  };

  dialog.showOpenDialog(options, importPaths);

  function importPaths(paths) {

    if (_.isEmpty(paths)) {
      return;
    }

    broadcast('import-start');

    Importer.handleImportZip(paths, onProgress)
      .then(doc => {
        broadcast('import-progress', {progress: 100, type: 'info', message: 'Imported successfully'});
        send({message: 'Imported successfully', doc: doc});
      })
      .catch(err => {
        send({error: true, message: err.toString()});
      });

    function onProgress(res) {
      broadcast('import-progress', res);
    }
  }
});

export default importZip;
