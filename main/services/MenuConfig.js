var Helper = require('./Helper');
var app = require('app');
var shell = require('shell');

function getTemplate(args) {

  var webContents = args.mainWindow.webContents;

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
    },
    {
      label: 'Find',
      click: function() {
        webContents.send('app-find');
      }
    },
    {
      label: 'Replace',
      click: function() {
        webContents.send('app-replace');
      }
    }
  ];

  var template = [
    {
      label: 'App',
      submenu: [
        {
          label: 'Import',
          click: function() {
            webContents.send('app-import');
          }
        },
        {
          label: 'Import Zip',
          click: function() {
            webContents.send('app-import-zip');
          }
        },
        {
          label: 'Open',
          click: function() {
            webContents.send('app-open');
          }
        },
        {
          label: 'Save',
          click: function() {
            webContents.send('app-save');
          }
        },
        {
          label: 'Save As',
          click: function() {
            webContents.send('app-save-as');
          }
        },
        {
          label: 'Export Zip',
          click: function() {
            webContents.send('app-export-zip');
          }
        },
        {
          label: 'Export File With PB',
          click: function() {
            webContents.send('app-export-file-with-pb');
          }
        },
        {
          label: 'Settings',
          click: function() {
            webContents.send('app-settings');
          }
        },
        {
          label: 'Spellcheck Exception List',
          click: function() {
            webContents.send('app-spellcheck-exception-list');
          }
        }
      ]
    },
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
            return Helper.isDarwin() ? 'Ctrl+Command+F' : 'F11';
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
              return Helper.isDarwin() ? 'Alt+Command+I' : 'Ctrl+Shift+I';
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

  if (Helper.isDarwin()) {
    template.unshift({
      label: 'Electron',
      submenu: [
        {
          label: 'About KETAKA Lite',
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
          click: function() {
            app.quit();
          }
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
  return template;
}

module.exports = {
  getTemplate: getTemplate
};
