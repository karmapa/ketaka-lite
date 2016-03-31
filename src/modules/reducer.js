import app from './app';
import doc from './doc';
import modalImport from './modalImport';
import modalEditDocs from './modalEditDocs';
import {combineReducers} from 'redux';

export default combineReducers({
  app,
  doc,
  modalImport,
  modalEditDocs
});
