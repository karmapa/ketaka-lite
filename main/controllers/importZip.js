import _ from 'lodash';
import {Importer} from '../services';
import {dialog} from 'electron';
import {ipcHandler} from '../decorators';

const importZip = ipcHandler(function(event, args) {

  const send = this.send;
  const broadcast = this.broadcast;
  const options = {
    properties: ['openFile'],
    filters: [
      {name: 'zip', extensions: ['zip']}
    ]
  };

  dialog.showOpenDialog(options, importPaths);

  function onProgress(res) {
    broadcast('import-progress', res);
  }

  async function importPaths(paths) {

    if (_.isEmpty(paths)) {
      return;
    }

    broadcast('import-start');
    const doc = await Importer.handleImportZip(paths, onProgress);

    if (doc) {
      broadcast('import-progress', {progress: 100, type: 'info', message: 'Imported successfully', clean: true});
      send({message: 'Imported successfully', doc});
    }
    else {
      send({error: true, message: 'Doc not created'});
    }
  }
});

export default importZip;
