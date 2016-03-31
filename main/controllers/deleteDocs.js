import Path from 'path';
import {Doc, Helper} from '../services';
import {ipcHandler} from '../decorators';
import _ from 'lodash';
import {PATH_APP_DOC} from '../constants/appConstants';

let deleteDocs = ipcHandler(function(event, res) {

  const docNames = res.docNames || [];
  const send = this.send;

  const promises = docNames.map(docName => {
    const path = Path.resolve(PATH_APP_DOC, docName);
    Helper.rimraf(path)
  });

  Promise.all(promises)
    .then(() => {
      send();
    });
});

export default deleteDocs;
