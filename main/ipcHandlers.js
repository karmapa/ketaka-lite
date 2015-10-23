var Doc = require('./services/Doc');
var Helper = require('./services/Helper');
var Importer = require('./services/Importer');
var PATH_APP_DOC = require('./constants').PATH_APP_DOC;
var Path = require('path');
var _ = require('lodash');
var dialog = require('dialog');
var ipcHandler = require('./decorators/ipcHandler');
var archiver = require('archiver');
var fs = require('fs');

exports.importButtonClicked = ipcHandler(function(event, args) {

  var send = this.send;
  var broadcast = this.broadcast;
  var options = {
    properties: ['openFile', 'openDirectory', 'multiSelections', 'createDirectory'],
    filters: [
      {name: 'zip', extensions: ['zip']},
      {name: 'Images', extensions: ['jpg']},
      {name: 'Text Files', extensions: ['xml', 'txt']}
    ]
  };

  dialog.showOpenDialog(options, importPaths);

  function importPaths(paths, force) {

    if (_.isEmpty(paths)) {
      return;
    }

    broadcast('import-start');

    Importer.handleImportPaths(paths, onProgress, force)
      .then(function(doc) {
        broadcast('import-progress', {progress: 100, type: 'info', message: 'Imported successfully'});
        send({message: 'Imported successfully', doc: doc});
      })
      .catch(function(err) {
        send({error: true, message: err.toString()});
      });

    function onProgress(res) {
      broadcast('import-progress', res);
    }
  }
});

exports.save = ipcHandler(function(event, doc) {

  var send = this.send;
  doc.changed = false;

  Doc.writeDoc(doc)
    .then(function() {
      send({message: 'Saved successfully', doc: doc});
    })
    .catch(function(error) {
      send({error: true, message: error});
    });
});

exports.pageImageUploadButtonClicked = ipcHandler(function(event, doc) {

  var send = this.send;
  var options = {
    properties: ['openFile'],
    filters: [
      {name: 'Images', extensions: ['jpg']}
    ]
  };

  dialog.showOpenDialog(options, function(paths) {

    if (_.isEmpty(paths)) {
      return;
    }

    var source = _.first(paths);
    var pathData = Path.basename(source);
    var page = doc.pages[doc.pageIndex];
    var filename = _.get(page, 'name') ? Doc.getImageFilenameByDoc(doc) : Path.basename(source);
    var dest = Path.resolve(PATH_APP_DOC, doc.name, 'images', filename);
    var fileType = Helper.getFileType(source);

    if ('image/jpeg' === fileType.mime) {

      var destDir = Path.dirname(dest);

      Helper.mkdirp(destDir)
        .then(function() {
          return Helper.copyFile(source, dest);
        })
        .then(function() {
          send({message: 'Image uploaded successfully', destImagePath: dest});
        })
        .catch(function(err) {
          send({error: true, message: err});
        });
    }
    else {
      send({error: true, message: 'Invalid image file type: ' + fileType.mime});
    }
  });
});

exports.addDoc = ipcHandler(function(event) {

  var send = this.send;
  var docName;

  Doc.findUniqueUntitledName()
    .then(function(name) {
      docName = name;
      return Helper.mkdirp(Path.resolve(PATH_APP_DOC, name, 'images'));
    })
    .then(function() {
      var doc = Doc.createDoc({name: docName});
      var page = Doc.createPage({name: 'untitled'});
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
  var send = this.send;
  Doc.getExistedDocNames()
    .then(function(docNames) {
      send({docNames: docNames});
    });
});

exports.changeDocSettings = ipcHandler(function(event, data) {

  var send = this.send;
  var doc = data.doc;

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

  var send = this.send;

  Doc.getExistedDocNames()
    .then(function(names) {
      send({names: names});
    });
});

exports.openBamboo = ipcHandler(function(event, arg) {

  var send = this.send;

  Doc.getDoc(arg.name)
    .then(function(doc) {
      send({doc: doc});
    });
});

exports.deleteDoc = ipcHandler(function(event, res) {

  var name = res.name;
  var send = this.send;
  var path = Path.resolve(PATH_APP_DOC, name);

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

exports.exportData = ipcHandler(function(event, arg) {
  var send = this.send;
  var name = arg.name;
  var filename = name + '.zip';
  var options = {
    title: 'Choose Export Path',
    defaultPath: filename
  };

  dialog.showSaveDialog(options, function(savePath) {

    if (! savePath) {
      send({message: 'Export was canceled'});
      return;
    }

    var archive = archiver('zip');
    var sourcePath = Path.resolve(PATH_APP_DOC, name);
    var output = fs.createWriteStream(savePath);

    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      send({message: 'Bamboo ' + name + ' exported successfully'});
    });

    archive.on('error', function(err) {
      send({error: true, message: err});
    });

    archive.pipe(output);
    archive.bulk([{expand: true, cwd: sourcePath, src: ['**'], dest: name}]);
    archive.finalize();
  });
});

exports.addPbFiles = ipcHandler(function(event, arg) {

  var doc = arg.doc;
  var send = this.send;
  var options = {
    properties: ['openFile', 'openDirectory', 'multiSelections', 'createDirectory'],
    filters: [
      {name: 'zip', extensions: ['zip']},
      {name: 'Text Files', extensions: ['xml', 'txt']}
    ]
  };

  dialog.showOpenDialog(options, function(paths) {
    if (_.isEmpty(paths)) {
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
