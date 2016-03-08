import {dialog} from 'electron';
import {ipcHandler} from '../decorators';
import {Doc, Helper} from '../services';

let exportFileWithPb = ipcHandler(function(event, arg) {

  let send = this.send;
  let docName = arg.name;
  let filename = docName + '.txt';
  let options = {
    title: 'Choose Export Path',
    defaultPath: filename
  };

  async function onDialogComplete(savePath) {

    if (! savePath) {
      send({message: 'Export was canceled'});
      return;
    }

   try {

     let doc = await Doc.getDoc(docName);
     let content = await Doc.genPbFileContent(doc);
     await Helper.writeFile(savePath, content);

   }
   catch(err) {
     console.error('error', err);
     send({error: true, message: err.toString()});
   };

   send({message: filename + ' exported successfully'});
  }

  dialog.showSaveDialog(options, onDialogComplete);
});

export default exportFileWithPb;
