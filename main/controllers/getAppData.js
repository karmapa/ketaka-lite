import {ipcHandler} from '../decorators';
import {PATH_APP_DOC} from '../constants/appConstants';

let getAppData = ipcHandler(function(event, arg) {
  let send = this.send;
  send({
    docPath: PATH_APP_DOC
  });
});

export default getAppData;
