import {Doc} from '../services';
import {ipcHandler} from '../decorators';

let findDocNames = ipcHandler(function(event) {
  let send = this.send;
  Doc.getExistedDocNames()
    .then(function(docNames) {
      send({docNames: docNames});
    });
});

export default findDocNames;
