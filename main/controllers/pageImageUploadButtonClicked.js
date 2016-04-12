import {first, get, isEmpty} from 'lodash';
import {Doc, Helper} from '../services';
import {dialog} from 'electron';
import {ipcHandler} from '../decorators';
import Path from 'path';
import {PATH_APP_DOC, VALID_IMAGE_EXTENSIONS} from '../constants/appConstants';

let pageImageUploadButtonClicked = ipcHandler(function(event, doc) {

  let send = this.send;
  let options = {
    properties: ['openFile'],
    filters: [
      {name: 'Images', extensions: VALID_IMAGE_EXTENSIONS}
    ]
  };

  dialog.showOpenDialog(options, function(paths) {

    if (isEmpty(paths)) {
      return;
    }

    let source = first(paths);
    let page = doc.pages[doc.pageIndex];
    let filename = get(page, 'name') ? Doc.getImageFilenameByDoc(doc) : Path.basename(source);
    let dest = Path.resolve(PATH_APP_DOC, doc.name, 'images', filename);
    let pathData = Path.parse(dest);
    let fileType = Helper.getFileType(source);

    let destDir = Path.dirname(dest);

    Helper.mkdirp(destDir)
      .then(() => {
        return Helper.copyFile(source, dest);
      })
      .then(() => {
        send({message: 'Image uploaded successfully', pathData: pathData});
      })
      .catch(err => {
        send({error: true, message: err});
      });
  });
});

export default pageImageUploadButtonClicked;
