import {Doc} from '../services';
import {ipcHandler} from '../decorators';

let openBamboo = ipcHandler(function(event, arg) {

  let send = this.send;

  Doc.getDoc(arg.name)
    .then(function(doc) {
      send({doc: doc});
    });
});

export default openBamboo;
