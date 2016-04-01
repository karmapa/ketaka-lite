import Path from 'path';
import archiver from 'archiver';
import fs from 'fs';
import {PATH_APP_DOC} from '../constants/appConstants';
import {dialog} from 'electron';
import {ipcHandler} from '../decorators';

let exportZip = ipcHandler(function(event, arg) {

  let send = this.send;
  let name = arg.name;
  let filename = name + '.zip';
  let options = {
    title: 'Choose Export Path',
    defaultPath: filename
  };

  dialog.showSaveDialog(options, function(savePath) {

    if (! savePath) {
      send({message: 'Export was canceled'});
      return;
    }

    let archive = archiver('zip');
    let sourcePath = Path.resolve(PATH_APP_DOC, name);
    let output = fs.createWriteStream(savePath);

    output.on('close', () => {
      send({message: filename + ' exported successfully'});
    });

    archive.on('error', err => {
      send({error: true, message: err});
    });

    archive.pipe(output);
    archive.bulk([{expand: true, cwd: sourcePath, src: ['**'], dest: name}]);
    archive.finalize();
  });
});

export default exportZip;
