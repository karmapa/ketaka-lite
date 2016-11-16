import {History} from './../services';
import {ipcHandler} from './../decorators';

const undoHistory = ipcHandler(async function(event, data) {

  const send = this.send;
  const {content, addedRow, removedRow} = History.undo(data.key, data.content);
  send({content, addedRow, removedRow});
});

export default undoHistory;
