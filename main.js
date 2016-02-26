import {app, ipcMain, crashReporter, screen, BrowserWindow, Menu} from 'electron';
import handlers from './main/handlers';
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

ipc.on('import-button-clicked', handlers.importButtonClicked);

ipc.on('import-zip', handlers.importZip);

ipc.on('save', handlers.save);

ipc.on('save-as', handlers.saveAs);

ipc.on('page-image-upload-button-clicked', handlers.pageImageUploadButtonClicked);

ipc.on('add-doc', handlers.addDoc);

ipc.on('find-doc-names', handlers.findDocNames);

ipc.on('change-doc-settings', handlers.changeDocSettings);

ipc.on('open', handlers.open);

ipc.on('open-bamboo', handlers.openBamboo);

ipc.on('delete-doc', handlers.deleteDoc);

ipc.on('export-zip', handlers.exportZip);

ipc.on('export-file-with-pb', handlers.exportFileWithPb);

ipc.on('add-pb-files', handlers.addPbFiles);

ipc.on('get-app-data', handlers.getAppData);
