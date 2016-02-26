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

  dialog.showSaveDialog(options, function(savePath) {

    if (! savePath) {
      send({message: 'Export was canceled'});
      return;
    }

    Doc.getDoc(docName)
      .then(doc => {
        return Doc.genPbFileContent(doc);
      })
      .then(content => {
        return Helper.writeFile(savePath, content);
      })
      .then(() => {
        send({message: filename + ' exported successfully'});
      })
      .catch(err => {
        console.error('error', err);
        send({error: true, message: err.toString()});
      });

  });
});

export default exportFileWithPb;
