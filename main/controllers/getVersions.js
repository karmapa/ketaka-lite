import {ipcHandler} from '../decorators';
import {app} from 'electron';

const getVersions = ipcHandler(function(event, args) {
  this.send({versions: {app: app.getVersion(), electron: process.versions.electron}});
});

export default getVersions;
