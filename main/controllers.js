import {Doc, Helper, Importer} from './services';
import {PATH_APP_DOC} from './constants';
import Path from 'path';
import _ from 'lodash';
import {dialog} from 'electron';
import {ipcHandler} from './decorators';
import archiver from 'archiver';
import fs from 'fs';

exports.importZip = ipcHandler(function(event, args) {

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

exports.importButtonClicked = ipcHandler(function(event, args) {

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

exports.save = ipcHandler(function(event, doc) {

  let send = this.send;
  doc.changed = false;

  Doc.writeDoc(doc)
    .then(function() {
      send({message: 'Saved successfully', doc: doc});
    })
    .catch(function(error) {
      send({error: true, message: error});
    });
});

exports.saveAs = ipcHandler(function(event, args) {

  let newDocName = args.newDocName;
  let oldDoc = args.doc;
  let send = this.send;

  let newDoc = _.cloneDeep(oldDoc);
  newDoc.name = newDocName;

  let oldImageFolderPath = Path.resolve(PATH_APP_DOC, oldDoc.name, 'images');
  let newImageFolderPath = Path.resolve(PATH_APP_DOC, newDoc.name, 'images');

  Helper.mkdirp(newImageFolderPath)
    .then(function() {
      return Helper.copy(oldImageFolderPath, newImageFolderPath);
    })
    .then(function() {
      return Doc.writeDoc(newDoc);
    })
    .then(function() {
      send({message: 'Saved successfully', doc: newDoc});
    })
    .catch(function(error) {
      send({error: true, message: error});
    });
});

exports.pageImageUploadButtonClicked = ipcHandler(function(event, doc) {

  let send = this.send;
  let options = {
    properties: ['openFile'],
    filters: [
      {name: 'Images', extensions: ['jpg']}
    ]
  };

  dialog.showOpenDialog(options, function(paths) {

    if (_.isEmpty(paths)) {
      return;
    }

    let source = _.first(paths);
    let page = doc.pages[doc.pageIndex];
    let filename = _.get(page, 'name') ? Doc.getImageFilenameByDoc(doc) : Path.basename(source);
    let dest = Path.resolve(PATH_APP_DOC, doc.name, 'images', filename);
    let pathData = Path.parse(dest);
    let fileType = Helper.getFileType(source);

    if ('image/jpeg' === fileType.mime) {

      let destDir = Path.dirname(dest);

      Helper.mkdirp(destDir)
        .then(() => {
          return Helper.copyFile(source, dest);
        })
        .then(() => {
          send({message: 'Image uploaded successfully', pathData: pathData});
        })
        .catch(err => {
          send({error: true, message: err});
        });
    }
    else {
      send({error: true, message: 'Invalid image file type: ' + fileType.mime});
    }
  });
});

