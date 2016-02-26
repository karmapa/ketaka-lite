import {app, ipcMain, crashReporter, screen, BrowserWindow, Menu} from 'electron';
import ipcHandlers from './main/ipcHandlers';
import bindEventName from './main/decorators/bindEventName';
import {Helper, MenuConfig} from './main/services';
import {PATH_APP_DOC} from './main/constants';

crashReporter.start({
  companyName: 'dharma-treasure',
  submitURL: 'https://log.dharma-treasure.org/ketaka-lite'
});

let mainWindow = null;

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {

  let size = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({width: size.width, height: size.height});

  Helper.mkdirp(PATH_APP_DOC)
    .then(() => {

      mainWindow.loadURL('file://' + __dirname + '/index.html');

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

const ipc = bindEventName(ipcMain);

ipc.on('import-button-clicked', ipcHandlers.importButtonClicked);

ipc.on('import-zip', ipcHandlers.importZip);

ipc.on('save', ipcHandlers.save);

ipc.on('save-as', ipcHandlers.saveAs);

ipc.on('page-image-upload-button-clicked', ipcHandlers.pageImageUploadButtonClicked);

ipc.on('add-doc', ipcHandlers.addDoc);

ipc.on('find-doc-names', ipcHandlers.findDocNames);

ipc.on('change-doc-settings', ipcHandlers.changeDocSettings);

ipc.on('open', ipcHandlers.open);

ipc.on('open-bamboo', ipcHandlers.openBamboo);

ipc.on('delete-doc', ipcHandlers.deleteDoc);

ipc.on('export-zip', ipcHandlers.exportZip);

ipc.on('export-file-with-pb', ipcHandlers.exportFileWithPb);

ipc.on('add-pb-files', ipcHandlers.addPbFiles);

ipc.on('get-app-data', ipcHandlers.getAppData);
