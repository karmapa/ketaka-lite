import {History} from './../services';
import {ipcHandler} from './../decorators';

const addHistory = ipcHandler(async function(event, data) {

  const send = this.send;
  const action = History.getActionByContents(data.prevContent, data.content);

  if (action.length > 0) {
    History.add(data.key, action);
  }
  send({message: 'history added'});
});


export default addHistory;
