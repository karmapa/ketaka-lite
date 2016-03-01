import Path from 'path';
import {Doc, Helper} from '../services';
import {ipcHandler} from '../decorators';

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
