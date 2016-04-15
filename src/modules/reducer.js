import app from './app';
import doc from './doc';
import modalProgress from './modalProgress';
import modalEditDocs from './modalEditDocs';
import modalAbout from './modalAbout';
import modalAlert from './modalAlert';
import {combineReducers} from 'redux';

export default combineReducers({
  app,
  doc,
  modalProgress,
  modalAbout,
  modalAlert,
  modalEditDocs
});
