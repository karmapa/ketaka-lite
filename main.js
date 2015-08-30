var BrowserWindow = require('browser-window');
var app = require('app');
var ipc = require('ipc');
var ipcHandlers = require('./main/ipcHandlers');

require('crash-reporter').start();

var mainWindow = null;

app.on('window-all-closed', function() {
  if ('darwin' !== process.platform) {
    app.quit();
  }
});

app.on('ready', function() {

  var screen = require('screen');
  var size = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({width: size.width, height: size.height});
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  mainWindow.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});

ipc.on('import-button-clicked', ipcHandlers.importButtonClicked);

ipc.on('save', ipcHandlers.save);

ipc.on('page-image-upload-button-clicked', ipcHandlers.pageImageUploadButtonClicked);

ipc.on('add-doc', ipcHandlers.addDoc);

ipc.on('find-doc-names', ipcHandlers.findDocNames);

ipc.on('change-doc-settings', ipcHandlers.changeDocSettings);
