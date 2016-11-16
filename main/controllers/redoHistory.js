import {History} from './../services';
import {ipcHandler} from './../decorators';

const redoHistory = ipcHandler(async function(event, data) {

  const send = this.send;
  const {content, addedRow, removedRow} = History.redo(data.key, data.content);
  send({content, addedRow, removedRow});
});

export default redoHistory;
