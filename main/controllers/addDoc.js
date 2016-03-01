import Path from 'path';
import {Doc, Helper} from '../services';
import {PATH_APP_DOC} from '../constants/appConstants';
import {ipcHandler} from '../decorators';

let addDoc = ipcHandler(function(event) {

  let send = this.send;
  let docName;

  Doc.findUniqueUntitledName()
    .then(function(name) {
      docName = name;
      return Helper.mkdirp(Path.resolve(PATH_APP_DOC, name, 'images'));
    })
    .then(function() {
      let doc = Doc.createDoc({name: docName});
      let page = Doc.createPage({name: 'untitled'});
      doc.pages.push(page);
      return Doc.writeDoc(doc);
    })
    .then(function(doc) {
      send({doc: doc});
    })
    .catch(function(err) {
      send({error: true, message: err});
    });
});

export default addDoc;
