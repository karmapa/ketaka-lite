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

exports.addDoc = ipcHandler(function(event) {

  let send = this.send;
  let docName;

  Doc.findUniqueUntitledName()
    .then(function(name) {
      docName = name;
      return Helper.mkdirp(Path.resolve(PATH_APP_DOC, name, 'images'));
    })
    .then(function() {
      let doc = Doc.createDoc({name: docName});
      let page = Doc.createPage({name: 'untitled'});
      doc.pages.push(page);
      return Doc.writeDoc(doc);
    })
    .then(function(doc) {
      send({doc: doc});
    })
    .catch(function(err) {
      send({error: true, message: err});
    });
});

exports.findDocNames = ipcHandler(function(event) {
  let send = this.send;
  Doc.getExistedDocNames()
    .then(function(docNames) {
      send({docNames: docNames});
    });
});

exports.changeDocSettings = ipcHandler(function(event, data) {

  let send = this.send;
  let doc = data.doc;

  Doc.changeDocSettings({
    doc: doc,
    docName: data.docName,
    oldDocName: doc.name,
    pageName: data.pageName,
    oldPageName: doc.pages[doc.pageIndex].name
  })
  .then(function(doc) {
    send({message: 'Doc settings have been changed', doc: doc});
  })
  .catch(function(err) {
    console.error('error', err);
    send({error: true, message: err});
  });
});

exports.open = ipcHandler(function(event) {

  let send = this.send;

  Doc.getExistedDocNames()
    .then(function(names) {
      send({names: names});
    });
});

exports.openBamboo = ipcHandler(function(event, arg) {

  let send = this.send;

  Doc.getDoc(arg.name)
    .then(function(doc) {
      send({doc: doc});
    });
});

exports.deleteDoc = ipcHandler(function(event, res) {

  let name = res.name;
  let send = this.send;
  let path = Path.resolve(PATH_APP_DOC, name);

  if (! name) {
    send();
    return;
  }

  Helper.rimraf(path)
    .then(function() {
      return Doc.getExistedDocNames()
    })
    .then(function(names) {
      send({names: names});
    });
});
