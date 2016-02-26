import {Doc} from '../services';
import {ipcHandler} from '../decorators';

let open = ipcHandler(function(event) {

  let send = this.send;

  Doc.getExistedDocNames()
    .then(function(names) {
      send({names: names});
    });
});

export default open;
