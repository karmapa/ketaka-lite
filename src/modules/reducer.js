import app from './app';
import doc from './doc';
import modalImport from './modalImport';
import modalEditDocs from './modalEditDocs';
import modalAbout from './modalAbout';
import {combineReducers} from 'redux';

export default combineReducers({
  app,
  doc,
  modalImport,
  modalAbout,
  modalEditDocs
});
