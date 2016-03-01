import Path from 'path';
import {Doc, Helper} from '../services';
import {PATH_APP_DOC} from '../constants/appConstants';
import {ipcHandler} from '../decorators';

let addDoc = ipcHandler(async function(event) {

  let send = this.send;
  let docName = await Doc.findUniqueUntitledName();

  await Helper.mkdirp(Path.resolve(PATH_APP_DOC, docName, 'images'));

  let doc = Doc.createDoc({name: docName});
  let page = Doc.createPage({name: 'untitled'});
  doc.pages.push(page);

  await Doc.writeDoc(doc);
  send({doc});
});

export default addDoc;
