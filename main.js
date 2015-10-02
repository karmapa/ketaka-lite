var BrowserWindow = require('browser-window');
var app = require('app');
var ipc = require('ipc');
var ipcHandlers = require('./main/ipcHandlers');
var bindEventName = require('./main/decorators/bindEventName');
var Helper = require('./main/services/Helper');
var PATH_APP_DOC = require('./main/constants').PATH_APP_DOC;
var Menu = require('menu');
var shell = require('shell');

require('crash-reporter').start();

function isDarwin() {
  return 'darwin' === process.platform;
}

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

app.once('ready', function() {

  if (Menu.getApplicationMenu()) {
    return;
  }

  var submenu = [
    {
      label: 'Undo',
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo'
    },
    {
      label: 'Redo',
      accelerator: 'Shift+CmdOrCtrl+Z',
      role: 'redo'
    },
    {
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    },
    {
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    },
    {
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste'
    },
    {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectall'
    }
  ];

  var template = [
    {
      label: 'Edit',
      submenu: submenu
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: function(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.reload();
            }
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: (function() {
            return isDarwin() ? 'Ctrl+Command+F' : 'F11';
          })(),
          click: function(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.setFullScreen(! focusedWindow.isFullScreen());
            }
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: (function() {
              return isDarwin() ? 'Alt+Command+I' : 'Ctrl+Shift+I';
          })(),
          click: function(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.toggleDevTools();
            }
          }
        },
      ]
    },
    {
      label: 'Window',
      role: 'window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
      ]
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: function() {
            shell.openExternal('http://electron.atom.io');
          }
        },
        {
          label: 'Documentation',
          click: function() {
            shell.openExternal('https://github.com/atom/electron/tree/master/docs#readme');
          }
        },
        {
          label: 'Community Discussions',
          click: function() {
            shell.openExternal('https://discuss.atom.io/c/electron');
          }
        },
        {
          label: 'Search Issues',
          click: function() {
            shell.openExternal('https://github.com/atom/electron/issues');
          }
        }
      ]
    }
  ];

  if (isDarwin()) {
    template.unshift({
      label: 'Electron',
      submenu: [
        {
          label: 'About Electron',
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide Electron',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers:'
        },
        {
          label: 'Show All',
          role: 'unhide:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function() { app.quit(); }
        },
      ]
    });
    template[3].submenu.push({
      type: 'separator'
    },
    {
      label: 'Bring All to Front',
      role: 'front'
    });
  }

  var menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
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
