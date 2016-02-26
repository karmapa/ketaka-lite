import _ from 'lodash';
import {Doc, Helper} from '../services';
import {dialog} from 'electron';
import {ipcHandler} from '../decorators';
import Path from 'path';
import {PATH_APP_DOC} from '../constants';

let pageImageUploadButtonClicked = ipcHandler(function(event, doc) {

  let send = this.send;
  let options = {
    properties: ['openFile'],
    filters: [
      {name: 'Images', extensions: ['jpg']}
    ]
  };

  dialog.showOpenDialog(options, function(paths) {

    if (_.isEmpty(paths)) {
      return;
    }

    let source = _.first(paths);
    let page = doc.pages[doc.pageIndex];
    let filename = _.get(page, 'name') ? Doc.getImageFilenameByDoc(doc) : Path.basename(source);
    let dest = Path.resolve(PATH_APP_DOC, doc.name, 'images', filename);
    let pathData = Path.parse(dest);
    let fileType = Helper.getFileType(source);

    if ('image/jpeg' === fileType.mime) {

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
    }
    else {
      send({error: true, message: 'Invalid image file type: ' + fileType.mime});
    }
  });
});

export default pageImageUploadButtonClicked;
