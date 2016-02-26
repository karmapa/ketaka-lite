import {Doc} from '../services';
import {ipcHandler} from '../decorators';

let save = ipcHandler(function(event, doc) {

  let send = this.send;
  doc.changed = false;

  Doc.writeDoc(doc)
    .then(function() {
      send({message: 'Saved successfully', doc: doc});
    })
    .catch(function(error) {
      send({error: true, message: error});
    });
});

export default save;
