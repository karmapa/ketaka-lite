import * as types from '../constants/ActionTypes';

export function importData() {
  return {
    type: types.IMPORT_DATA
  };
}

export function save(uuid) {
  return {
    type: types.SAVE,
    uuid
  };
}

export function saveAs() {
  return {
    type: types.SAVE_AS
  };
}

export function exportData() {
  return {
    type: types.EXPORT_DATA
  };
}

export function settings() {
  return {
    type: types.SETTINGS
  };
}

export function addDoc(doc) {
  return {
    type: types.ADD_DOC,
    doc
  };
}

export function openDoc(doc) {
  return {
    type: types.ADD_DOC,
    doc
  };
}

export function addPage(uuid, pageName) {
  return {
    type: types.ADD_PAGE,
    uuid,
    pageName
  };
}

export function importDoc(doc) {
  return {
    type: types.IMPORT_DOC,
    doc
  };
}

export function closeDoc(uuid) {
  return {
    type: types.CLOSE_DOC,
    uuid
  };
}

export function toNextPage(uuid) {
  return {
    type: types.TO_NEXT_PAGE,
    uuid
  };
}

export function toPreviousPage(uuid) {
  return {
    type: types.TO_PREVIOUS_PAGE,
    uuid
  };
}

export function setPageIndex(uuid, pageIndex) {
  return {
    type: types.SET_PAGE_INDEX,
    uuid,
    pageIndex
  };
}

export function writePageContent(uuid, pageIndex, content) {
  return {
    type: types.WRITE_PAGE_CONTENT,
    uuid,
    pageIndex,
    content
  };
}
