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

