let Helper = require('./Helper');
let app = require('app');
let shell = require('shell');

function getTemplate(args) {

  let webContents = args.mainWindow.webContents;

  let submenu = [
    {
      label: 'Undo',
      accelerator: 'CmdOrCtrl+Z',
      click: () => {
        webContents.send('app-undo');
      }
    },
    {
      label: 'Redo',
      accelerator: 'Shift+CmdOrCtrl+Z',
      click: () => {
        webContents.send('app-redo');
      }
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
      click: () => {
        webContents.send('app-select-all');
      }
    },
    {
      label: 'Find',
      click: () => {
        webContents.send('app-find');
      }
    },
    {
      label: 'Replace',
      click: () => {
        webContents.send('app-replace');
      }
    }
  ];

  let template = [
    {
      label: 'App',
      submenu: [
        {
          label: 'Import',
          click: () => {
            webContents.send('app-import');
          }
        },
        {
          label: 'Import Zip',
          click: () => {
            webContents.send('app-import-zip');
          }
        },
        {
          label: 'Open',
          click: () => {
            webContents.send('app-open');
          }
        },
        {
          label: 'Edit Docs',
          click: () => {
            webContents.send('app-edit-docs');
          }
        },
        {
          label: 'Save',
          click: () => {
            webContents.send('app-save');
          }
        },
        {
          label: 'Save As',
          click: () => {
            webContents.send('app-save-as');
          }
        },
        {
          label: 'Export Zip',
          click: () => {
            webContents.send('app-export-zip');
          }
        },
        {
          label: 'Export File With PB',
          click: () => {
            webContents.send('app-export-file-with-pb');
          }
        },
        {
          label: 'Settings',
          click: () => {
            webContents.send('app-settings');
          }
        },
        {
          label: 'Spellcheck Exception List',
          click: () => {
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
          accelerator:  Helper.isDarwin() ? 'Ctrl+Command+F' : 'F11',
          click: function(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.setFullScreen(! focusedWindow.isFullScreen());
            }
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator:  Helper.isDarwin() ? 'Alt+Command+I' : 'Ctrl+Shift+I',
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
          click: () => {
            shell.openExternal('http://electron.atom.io');
          }
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/atom/electron/tree/master/docs#readme');
          }
        },
        {
          label: 'Community Discussions',
          click: () => {
            shell.openExternal('https://discuss.atom.io/c/electron');
          }
        },
        {
          label: 'Search Issues',
          click: () => {
            shell.openExternal('https://github.com/atom/electron/issues');
          }
        },
        {
          label: 'About KETAKA Lite',
          click: () => webContents.send('app-about')
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
          click: () => {
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
