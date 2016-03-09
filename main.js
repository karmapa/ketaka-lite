import {app, ipcMain, crashReporter, screen, BrowserWindow, Menu} from 'electron';
import * as controllers from './main/controllers';
import bindEventName from './main/decorators/bindEventName';
import {Helper, MenuConfig} from './main/services';
import {PATH_APP_DOC} from './main/constants/appConstants';

const ipc = bindEventName(ipcMain);

crashReporter.start({
  companyName: 'dharma-treasure',
  submitURL: 'https://log.dharma-treasure.org/ketaka-lite'
});

let mainWindow = null;
let closeConfirmed = false;

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {

  let size = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({width: size.width, height: size.height});

  Helper.mkdirp(PATH_APP_DOC)
    .then(() => {

      mainWindow.loadURL('file://' + __dirname + '/index.html');

      mainWindow.on('close', event => {
        if (! closeConfirmed) {
          event.preventDefault();
          mainWindow.webContents.send('app-close');
        }
      });

      ipc.on('close', () => {
        closeConfirmed = true;
        mainWindow.close();
      });

      ipc.on('trigger-selectall', () => {
        mainWindow.webContents.selectAll();
      });

      mainWindow.on('closed', () => {
        mainWindow = null;
      });
    });
});

app.once('ready', () => {
  let template = MenuConfig.getTemplate({mainWindow: mainWindow});
  let menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

ipc.on('import-button-clicked', controllers.importButtonClicked);

ipc.on('import-zip', controllers.importZip);

ipc.on('save', controllers.save);

ipc.on('save-as', controllers.saveAs);

ipc.on('page-image-upload-button-clicked', controllers.pageImageUploadButtonClicked);

ipc.on('add-doc', controllers.addDoc);

ipc.on('find-doc-names', controllers.findDocNames);

ipc.on('change-doc-settings', controllers.changeDocSettings);

ipc.on('open', controllers.open);

ipc.on('open-bamboo', controllers.openBamboo);

ipc.on('delete-doc', controllers.deleteDoc);

ipc.on('export-zip', controllers.exportZip);

ipc.on('export-file-with-pb', controllers.exportFileWithPb);

ipc.on('add-pb-files', controllers.addPbFiles);

ipc.on('get-app-data', controllers.getAppData);
