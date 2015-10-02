var BrowserWindow = require('browser-window');
var app = require('app');
var ipc = require('ipc');
var ipcHandlers = require('./main/ipcHandlers');
var bindEventName = require('./main/decorators/bindEventName');
var Helper = require('./main/services/Helper');
var PATH_APP_DOC = require('./main/constants').PATH_APP_DOC;

require('crash-reporter').start();

var mainWindow = null;

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {

  Helper.mkdirp(PATH_APP_DOC)
    .then(function() {

      var screen = require('screen');
      var size = screen.getPrimaryDisplay().workAreaSize;

      mainWindow = new BrowserWindow({width: size.width, height: size.height});
      mainWindow.loadUrl('file://' + __dirname + '/index.html');

      mainWindow.on('closed', function() {
        mainWindow = null;
      });
    });
});

ipc = bindEventName(ipc);

ipc.on('import-button-clicked', ipcHandlers.importButtonClicked);

ipc.on('save', ipcHandlers.save);

ipc.on('page-image-upload-button-clicked', ipcHandlers.pageImageUploadButtonClicked);

ipc.on('add-doc', ipcHandlers.addDoc);

ipc.on('find-doc-names', ipcHandlers.findDocNames);

ipc.on('change-doc-settings', ipcHandlers.changeDocSettings);

ipc.on('open', ipcHandlers.open);

ipc.on('open-bamboo', ipcHandlers.openBamboo);

ipc.on('delete-doc', ipcHandlers.deleteDoc);

ipc.on('export-data', ipcHandlers.exportData);
