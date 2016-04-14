import Path from 'path';
import {Doc, Helper} from '../services';
import {ipcHandler} from '../decorators';

const constants = require('../constants/appConstants');
const PATH_APP_DOC = constants.PATH_APP_DOC;

const deletePageImage = ipcHandler(async function(event, res) {

  console.log('???', res);

  const send = this.send;
  const path = Path.resolve(PATH_APP_DOC, res.docName, 'images', res.imageFilename);

  if ((! res.imageFilename) || (! res.docName)) {
    send();
    return;
  }

  console.log('here', path);

  await Helper.rimraf(path)
  send();
});

export default deletePageImage;
