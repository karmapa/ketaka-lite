import Path from 'path';
import {Doc, Helper} from '../services';
import {ipcHandler} from '../decorators';

const constants = require('../constants/appConstants');
const PATH_APP_DOC = constants.PATH_APP_DOC;

let deleteDoc = ipcHandler(function(event, res) {

  let name = res.name;
  let send = this.send;
  let path = Path.resolve(PATH_APP_DOC, name);

  if (! name) {
    send();
    return;
  }

  Helper.rimraf(path)
    .then(function() {
      return Doc.getExistedDocNames()
    })
    .then(function(names) {
      send({names: names});
    });
});

export default deleteDoc;
