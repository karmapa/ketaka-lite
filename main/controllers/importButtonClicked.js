import _ from 'lodash';
import {Importer} from '../services';
import {dialog} from 'electron';
import {ipcHandler} from '../decorators';

let importButtonClicked = ipcHandler(function(event, args) {

  args = args || {};

  let send = this.send;
  let broadcast = this.broadcast;
  let options = {
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

  function importPaths(paths) {

    if (_.isEmpty(paths)) {
      return;
    }

    broadcast('import-start');

    Importer.handleImportPaths(paths, onProgress, args.force)
      .then(function(doc) {
        broadcast('import-progress', {progress: 100, type: 'info', message: 'Imported successfully'});
        send({message: 'Imported successfully', doc: doc});
      })
      .catch(function(err) {
        if ('fileCountWarning' === err.type) {
          send({
            error: true,
            type: 'fileCountWarning',
            fileCount: err.fileCount,
            paths: paths
          });
        }
        send({error: true, message: err.toString()});
      });

    function onProgress(res) {
      broadcast('import-progress', res);
    }
  }
});

export default importButtonClicked;
