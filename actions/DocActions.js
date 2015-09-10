import Ipc from '../services/Ipc';

export const IMPORT_DATA = 'IMPORT_DATA';

export function importData() {
  return {
    type: IMPORT_DATA
  };
}

export const SAVE = 'SAVE';

export function save(uuid) {
  return {
    type: SAVE,
    uuid
  };
}

export const EXPORT_DATA = 'EXPORT_DATA';

export function exportData() {
  return {
    type: EXPORT_DATA
  };
}

export const RECEIVE_DOC = 'RECEIVE_DOC';

export function receiveDoc(doc) {
  return {
    type: RECEIVE_DOC,
    doc
  };
}

export function createDoc() {
  return dispatch => {
    Ipc.send('add-doc')
      .then(res => dispatch(receiveDoc(res.doc)));
  };
}

export const ADD_PAGE = 'ADD_PAGE';

export function addPage(uuid, pageName) {
  return {
    type: ADD_PAGE,
    uuid,
    pageName
  };
}

export const IMPORT_DOC = 'IMPORT_DOC';

export function importDoc(doc) {
  return {
    type: IMPORT_DOC,
    doc
  };
}

export const CLOSE_DOC = 'CLOSE_DOC';

export function closeDoc(uuid) {
  return {
    type: CLOSE_DOC,
    uuid
  };
}

export const TO_NEXT_PAGE = 'TO_NEXT_PAGE';

export function toNextPage(uuid) {
  return {
    type: TO_NEXT_PAGE,
    uuid
  };
}

export const TO_PREVIOUS_PAGE = 'TO_PREVIOUS_PAGE';

export function toPreviousPage(uuid) {
  return {
    type: TO_PREVIOUS_PAGE,
    uuid
  };
}

export const SET_PAGE_INDEX = 'SET_PAGE_INDEX';

export function setPageIndex(uuid, pageIndex) {
  return {
    type: SET_PAGE_INDEX,
    uuid,
    pageIndex
  };
}

export const WRITE_PAGE_CONTENT = 'WRITE_PAGE_CONTENT';

export function writePageContent(uuid, pageIndex, content) {
  return {
    type: WRITE_PAGE_CONTENT,
    uuid,
    pageIndex,
    content
  };
}

export const SAVE_FONT_RECORD = 'SAVE_FONT_RECORD';

export function saveFontRecord(uuid, pageIndex, fontRecords) {
  return {
    type: SAVE_FONT_RECORD,
    uuid,
    pageIndex,
    fontRecords
  };
}

export const DELETE_PAGE = 'DELETE_PAGE';

export function deletePage(uuid, pageIndex) {
  return {
    type: DELETE_PAGE,
    uuid,
    pageIndex
  };
}

export const UPDATE_PAGE_IMAGE_PATH = 'UPDATE_PAGE_IMAGE_PATH';

export function updatePageImagePath(uuid, pageIndex, destImagePath) {
  return {
    type: UPDATE_PAGE_IMAGE_PATH,
    uuid,
    pageIndex,
    destImagePath
  };
}

export const TOGGLE_EDIT_CHUNK = 'TOGGLE_EDIT_CHUNK';

export function toggleEditChunk(uuid) {
  return {
    type: TOGGLE_EDIT_CHUNK,
    uuid
  };
}
