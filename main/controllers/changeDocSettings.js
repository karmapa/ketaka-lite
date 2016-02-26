import {Doc} from '../services';
import {ipcHandler} from '../decorators';

let changeDocSettings = ipcHandler(function(event, data) {

  let send = this.send;
  let doc = data.doc;

  Doc.changeDocSettings({
    doc: doc,
    docName: data.docName,
    oldDocName: doc.name,
    pageName: data.pageName,
    oldPageName: doc.pages[doc.pageIndex].name
  })
  .then(function(doc) {
    send({message: 'Doc settings have been changed', doc: doc});
  })
  .catch(function(err) {
    console.error('error', err);
    send({error: true, message: err});
  });
});

export default changeDocSettings;
