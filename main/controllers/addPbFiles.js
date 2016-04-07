import {isEmpty} from 'lodash';
import {Importer} from '../services';
import {dialog} from 'electron';
import {ipcHandler} from '../decorators';

let addPbFiles = ipcHandler(function(event, arg) {

  let doc = arg.doc;
  let send = this.send;
  let options = {
    properties: ['openFile', 'openDirectory', 'multiSelections', 'createDirectory'],
    filters: [
      {name: 'zip', extensions: ['zip']},
      {name: 'Text Files', extensions: ['xml', 'txt']}
    ]
  };

  dialog.showOpenDialog(options, function(paths) {
    if (isEmpty(paths)) {
      return;
    }
    Importer.addPbFiles(doc, paths)
      .then(function(doc) {
        send({message: 'Page break files added successfully', doc: doc});
      })
      .catch(function(err) {
        console.error('error', err);
        send({error: true, message: err.toString()});
      });
  });
});

export default addPbFiles;
