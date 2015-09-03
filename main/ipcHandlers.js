var Doc = require('./services/Doc');
var Helper = require('./services/Helper');
var Importer = require('./services/Importer');
var Path = require('path');
var _ = require('lodash');
var dialog = require('dialog');
var PATH_APP_DOC = require('./constants').PATH_APP_DOC;

exports.importButtonClicked = function(event, overridePaths) {

  overridePaths = overridePaths || [];

  var send = event.sender.send.bind(event.sender);
  var options = {
    properties: ['openFile', 'openDirectory', 'multiSelections', 'createDirectory'],
    filters: [
      {name: 'Images', extensions: ['jpg']},
      {name: 'Text Files', extensions: ['csv', 'txt']}
    ]
  };

  // force import, will override bamboo
  if (overridePaths.length > 0) {
    importPaths(overridePaths, true);
  } else {
    dialog.showOpenDialog(options, importPaths);
  }

  function importPaths(paths, force) {

    if (_.isEmpty(paths)) {
      return;
    }

    send('import-start');

    Importer.handleImportPaths(paths, onProgress, force)
      .then(function(doc) {
        send('import-progress', {progress: 100, type: 'info', message: 'Imported successfully'});
        send('import-done', {message: 'Imported successfully', doc: doc});
      })
      .catch(function(err) {

        if ('bambooExisted' === err.type) {
          return send('confirm-bamboo-override', err);
        }
        send('import-error', {message: err});
      });

    function onProgress(res) {
      send('import-progress', res);
    }
  }
};

exports.save = function(event, doc) {

  var send = event.sender.send.bind(event.sender);
  doc.changed = false;

  Doc.writeDoc(doc)
    .then(function() {
      send('save-done', {message: 'Saved successfully', doc: doc});
    })
    .catch(function(error) {
      send({message: error});
    });
};

exports.pageImageUploadButtonClicked = function(event, doc) {

  var send = event.sender.send.bind(event.sender);
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
          send('page-image-upload-done', {message: 'Image uploaded successfully', destImagePath: dest});
        })
        .catch(function(err) {
          send('page-image-upload-error', {message: err});
        });
    }
    else {
      send('page-image-upload-error', {message: 'Invalid image file type: ' + fileType.mime});
    }
  });
};

exports.addDoc = function(event) {

  var send = event.sender.send.bind(event.sender);
  var docName;

  Doc.findUniqueUntitledName()
    .then(function(name) {
      docName = name;
      return Helper.mkdirp(Path.resolve(PATH_APP_DOC, name, 'images'));
    })
    .then(function() {
      var doc = Doc.createDoc({name: docName});
      var page = Doc.createPage({name: 'Untitled'});
      doc.pages.push(page);
      return Doc.writeDoc(doc);
    })
    .then(function(doc) {
      send('add-doc-done', {doc: doc});
    })
    .catch(function(err) {
      send('add-doc-error', {message: err});
    });
};

exports.findDocNames = function(event) {
  var send = event.sender.send.bind(event.sender);
  Doc.getExistedDocNames()
    .then(function(docNames) {
      send('find-doc-names-done', docNames);
    });
};

exports.changeDocSettings = function(event, data) {

  var send = event.sender.send.bind(event.sender);
  var doc = data.doc;

  Doc.changeDocSettings({
    doc: doc,
    docName: data.docName,
    oldDocName: doc.name,
    pageName: data.pageName,
    oldPageName: doc.pages[doc.pageIndex].name
  })
  .then(function(doc) {
    send('change-doc-settings-done', {message: 'Doc settings have been changed', doc: doc});
  })
  .catch(function(err) {
    send('change-doc-settings-error', {message: err});
  });
};

exports.open = function(event) {

  var send = event.sender.send.bind(event.sender);

  Doc.getExistedDocNames()
    .then(function(names) {
      send('open-done', {names: names});
    });
};

exports.openBamboo = function(event, arg) {

  var send = event.sender.send.bind(event.sender);

  Doc.getDoc(arg.name)
    .then(function(doc) {
      send('open-bamboo-done', {doc: doc});
    });
};

exports.deleteDoc = function(event, res) {

  var name = res.name;
  var send = event.sender.send.bind(event.sender);
  var path = Path.resolve(PATH_APP_DOC, name);

  if (! name) {
    return;
  }

  Helper.rimraf(path)
    .then(function() {
      return Doc.getExistedDocNames()
    })
    .then(function(names) {
      send('delete-doc-done', {names: names});
    });
};
