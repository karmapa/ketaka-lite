import * as types from '../actions/DocActions';
import {REGEXP_PAGE} from '../constants/AppConstants';
import _ from 'lodash';
import naturalSort from 'javascript-natural-sort';

const actionsMap = {
  [types.IMPORT_DATA]: importData,
  [types.SAVE]: save,
  [types.EXPORT_DATA]: exportData,
  [types.SETTINGS]: settings,
  [types.RECEIVE_DOC]: receiveDoc,
  [types.ADD_PAGE]: addPage,
  [types.IMPORT_DOC]: importDoc,
  [types.CLOSE_DOC]: closeDoc,
  [types.TO_NEXT_PAGE]: toNextPage,
  [types.TO_PREVIOUS_PAGE]: toPreviousPage,
  [types.SET_PAGE_INDEX]: setPageIndex,
  [types.WRITE_PAGE_CONTENT]: writePageContent,
  [types.SAVE_FONT_RECORD]: saveFontRecord,
  [types.DELETE_PAGE]: deletePage,
  [types.TOGGLE_EDIT_CHUNK]: toggleEditChunk,
  [types.UPDATE_PAGE_IMAGE_PATH]: updatePageImagePath
};

export default function docs(state = [], action) {
  const reduceFn = actionsMap[action.type];
  return reduceFn ? reduceFn(state, action) : state;
}

function importData(state) {
  return state;
}

function save(state, action) {
  let {index, doc} = findDocDataByUuid(state, action.uuid);

  if (! doc) {
    return state;
  }
  return [
    ...state.slice(0, index),
    Object.assign({}, state[index], {changed: false}),
    ...state.slice(index + 1)
  ];
}

function toggleEditChunk(state, action) {
  let {doc, index} = findDocDataByUuid(state, action.uuid);

  if (! doc) {
    return state;
  }

  return [
    ...state.slice(0, index),
    Object.assign({}, doc, {editChunk: ! doc.editChunk}),
    ...state.slice(index + 1)
  ];
}

function exportData(state) {
  return state;
}

function settings(state) {
  return state;
}

function receiveDoc(state, action) {
  let {doc, index} = findDocDataByUuid(state, action.doc.uuid);

  // override existed doc
  if (doc) {
    return [
      ...state.slice(0, index),
      Object.assign({}, action.doc),
      ...state.slice(index + 1)
    ];
  } else {
    return [...state, action.doc];
  }
}

function findPageInsertIndex(pages, pageName) {

  // wether matches format like 1.1a, 1.1b ..etc
  let isInsertPageValid = REGEXP_PAGE.test(pageName);

  let validPages = pages.filter(page => REGEXP_PAGE.test(page.name));
  let inValidPages = pages.filter(page => ! REGEXP_PAGE.test(page.name));

  if (isInsertPageValid) {
    for (let i = 0, len = validPages.length; i < len; i++) {

      let page = validPages[i];
      let res = naturalSort(pageName, page.name);

      if (-1 === res) {
        return i;
      }

    }
    return validPages.length;
  }
  else {
    for (let i = 0, len = inValidPages.length; i < len; i++) {

      let page = inValidPages[i];
      let res = naturalSort(pageName, page.name);

      if (-1 === res) {
        return i + validPages.length;
      }
    }
    return pages.length;
  }

}

function addPage(state, action) {
  let {doc, index} = findDocDataByUuid(state, action.uuid);

  if (! doc) {
    return state;
  }

  let insertIndex = findPageInsertIndex(doc.pages, action.pageName);

  let newPage = {
    name: action.pageName,
    content: '',
    destImagePath: '',
    config: {}
  };

  doc.pages.splice(insertIndex, 0, newPage);
  doc.changed = true;

  return [
    ...state.slice(0, index),
    Object.assign({}, doc),
    ...state.slice(index + 1)
  ];
}

function deletePage(state, action) {
  let {doc, index} = findDocDataByUuid(state, action.uuid);
  let {pageIndex} = action;

  if (! doc) {
    return state;
  }

  let page = doc.pages[pageIndex];

  if (! page) {
    return state;
  }

  doc.pages.splice(pageIndex, 1);

  return [
    ...state.slice(0, index),
    Object.assign({}, doc, {pages: doc.pages}),
    ...state.slice(index + 1)
  ];
}

function importDoc(state, action) {

  let {doc, index} = findDocDataByName(state, action.doc.name);

  // override existed doc
  if (doc) {
    action.doc.uuid = doc.uuid;
    return [
      ...state.slice(0, index),
      Object.assign({}, action.doc),
      ...state.slice(index + 1)
    ];
  } else {
    return [...state, action.doc];
  }
}

function closeDoc(state, action) {
  return state.filter(doc => {
    return doc.uuid !== action.uuid;
  });
}

function findDocDataByUuid(docs, uuid) {
  return findDocDataByProp(docs, 'uuid', uuid);
}

function findDocDataByName(docs, name) {
  return findDocDataByProp(docs, 'name', name);
}

function findDocDataByProp(docs, prop, value) {
  let foundIndex = -1;
  let foundDoc = docs.find((doc, index) => {
    if (doc[prop] === value) {
      foundIndex = index;
      return true;
    }
    return false;
  });
  return {
    index: foundIndex,
    doc: foundDoc
  };
}

function toNextPage(state, action) {

  let {doc, index} = findDocDataByUuid(state, action.uuid);

  if (! doc) {
    return state;
  }

  let nextPageIndex = doc.pageIndex + 1;

  if (nextPageIndex < doc.pages.length) {
    return [
      ...state.slice(0, index),
      Object.assign({}, state[index], {pageIndex: nextPageIndex}),
      ...state.slice(index + 1)
    ];
  }
  return state;
}

function toPreviousPage(state, action) {

  let {doc, index} = findDocDataByUuid(state, action.uuid);

  if (! doc) {
    return state;
  }

  let previousPageIndex = doc.pageIndex - 1;

  if (previousPageIndex >= 0) {
    return [
      ...state.slice(0, index),
      Object.assign({}, state[index], {pageIndex: previousPageIndex}),
      ...state.slice(index + 1)
    ];
  }
  return state;
}

function setPageIndex(state, action) {

  let {doc, index} = findDocDataByUuid(state, action.uuid);
  let pageIndex = action.pageIndex;

  if (! doc) {
    return state;
  }

  if (undefined !== doc.pages[pageIndex]) {
    return [
      ...state.slice(0, index),
      Object.assign({}, state[index], {pageIndex}),
      ...state.slice(index + 1)
    ];
  }
  return state;
}

function writePageContent(state, action) {

  let {doc, index} = findDocDataByUuid(state, action.uuid);

  if (! doc) {
    return state;
  }

  let page = doc.pages[action.pageIndex];

  if (! page) {
    return state;
  }
  page.content = action.content;
  return [
    ...state.slice(0, index),
    Object.assign({}, state[index], {changed: true, pages: doc.pages}),
    ...state.slice(index + 1)
  ];
}

function saveFontRecord(state, action) {

  let doc = state.find(doc => doc.uuid === action.uuid);

  if (! doc) {
    return state;
  }

  let page = doc.pages[action.pageIndex];

  if (! page) {
    return state;
  }

  if (! _.isArray(page.config.fontRecords)) {
    page.config.fontRecords = [];
  }

  page.config.fontRecords = page.config.fontRecords.concat(action.fontRecords);

  return Object.assign([], state);
}

function updatePageImagePath(state, action) {

  let {doc, index} = findDocDataByUuid(state, action.uuid);
  let {pageIndex} = action;

  if (! doc) {
    return state;
  }

  let page = doc.pages[pageIndex];

  if (! page) {
    return state;
  }

  page.pathData = action.pathData;

  return [
    ...state.slice(0, index),
    Object.assign({}, doc, {changed: true, pages: doc.pages}),
    ...state.slice(index + 1)
  ];
}
