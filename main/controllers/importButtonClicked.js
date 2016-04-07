import {isEmpty} from 'lodash';
import {Importer} from '../services';
import {dialog} from 'electron';
import {ipcHandler} from '../decorators';

const importButtonClicked = ipcHandler(function(event, args = {}) {

  const send = this.send;
  const broadcast = this.broadcast;
  const options = {
    properties: ['openFile', 'openDirectory', 'multiSelections', 'createDirectory'],
    filters: [
      {name: 'Images', extensions: ['bmp', 'gif', 'jpg', 'png']},
      {name: 'Text Files', extensions: ['xml', 'txt']}
    ]
  };

  if (args.paths) {
    importPaths(args.paths);
  }
  else {
    dialog.showOpenDialog(options, importPaths);
  }

  async function importPaths(paths) {

    if (isEmpty(paths)) {
      return;
    }

    broadcast('import-start');

    try {
      const doc = await Importer.handleImportPaths(paths, onProgress, args.force);
      onProgress({progress: 100, type: 'info', message: 'Imported successfully'});
      send({message: 'Imported successfully', doc});
    }
    catch(err) {

      if ('fileCountWarning' === err.type) {
        send({
          error: true,
          type: 'fileCountWarning',
          fileCount: err.fileCount,
          paths
        });
      }
      send({error: true, message: err.toString()});
    }
  }

  function onProgress(res) {
    broadcast('import-progress', res);
  }
});

export default importButtonClicked;
