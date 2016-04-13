import Path from 'path';
import archiver from 'archiver';
import fs from 'fs';
import {PATH_APP_DOC} from '../constants/appConstants';
import {dialog} from 'electron';
import {ipcHandler} from '../decorators';

const exportZip = ipcHandler(function(event, arg) {

  const send = this.send;
  const name = arg.name;
  const filename = name + '.zip';
  const options = {
    title: 'Choose Export Path',
    defaultPath: filename
  };

  dialog.showSaveDialog(options, savePath => {

    if (! savePath) {
      send({message: 'Export was canceled'});
      return;
    }


    const archive = archiver('zip');
    const sourcePath = Path.resolve(PATH_APP_DOC, name);
    const output = fs.createWriteStream(savePath);

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
