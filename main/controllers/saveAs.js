import Path from 'path';
import {Doc, Helper} from '../services';
import {PATH_APP_DOC} from '../constants/appConstants';
import {ipcHandler} from '../decorators';
import _ from 'lodash';
import uuid from 'node-uuid';

let saveAs = ipcHandler(function(event, args) {

  let newDocName = args.newDocName;
  let oldDoc = args.doc;
  let send = this.send;

  let newDoc = _.cloneDeep(oldDoc);
  newDoc.uuid = uuid.v4();
  newDoc.name = newDocName;

  let oldImageFolderPath = Path.resolve(PATH_APP_DOC, oldDoc.name, 'images');
  let newImageFolderPath = Path.resolve(PATH_APP_DOC, newDoc.name, 'images');

  Helper.mkdirp(newImageFolderPath)
    .then(function() {
      return Helper.copy(oldImageFolderPath, newImageFolderPath);
    })
    .then(function() {
      return Doc.writeDoc(newDoc);
    })
    .then(function() {
      send({message: 'Saved successfully', doc: newDoc});
    })
    .catch(function(error) {
      send({error: true, message: error});
    });
});

export default saveAs;
