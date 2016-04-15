import Path from 'path';
import {Doc, Helper} from '../services';
import {ipcHandler} from '../decorators';

const constants = require('../constants/appConstants');
const PATH_APP_DOC = constants.PATH_APP_DOC;

const deletePageImage = ipcHandler(async function(event, res) {

  const send = this.send;
  const doc = await Doc.getDoc(res.docName);
  const path = Path.resolve(PATH_APP_DOC, res.docName, 'images', res.imageFilename);

  if ((! res.imageFilename) || (! res.docName)) {
    send();
    return;
  }
  doc.pages[doc.pageIndex].pathData = {};
  await Helper.rimraf(path)
  await Doc.writeDoc(doc);

  send();
});

export default deletePageImage;
