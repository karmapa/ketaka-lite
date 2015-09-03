import * as types from '../actions/DocActions';
import _ from 'lodash';

const actionsMap = {
  [types.IMPORT_DATA]: importData,
  [types.SAVE]: save,
  [types.SAVE_AS]: saveAs,
  [types.EXPORT_DATA]: exportData,
  [types.SETTINGS]: settings,
  [types.RECEIVE_DOC]: receiveDoc,
  [types.OPEN_DOC]: openDoc,
  [types.ADD_PAGE]: addPage,
  [types.IMPORT_DOC]: importDoc,
  [types.CLOSE_DOC]: closeDoc,
  [types.TO_NEXT_PAGE]: toNextPage,
  [types.TO_PREVIOUS_PAGE]: toPreviousPage,
  [types.SET_PAGE_INDEX]: setPageIndex,
  [types.WRITE_PAGE_CONTENT]: writePageContent
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

function saveAs(state) {
  return state;
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

function openDoc(state, action) {
  return [...state, action.doc];
}

function addPage(state, action) {
  let {doc, index} = findDocDataByUuid(state, action.uuid);

  if (! doc) {
    return state;
  }
  let insertIndex = _.findIndex(doc.pages, page => action.pageName < page.name);

  if (-1 === insertIndex) {
    insertIndex = doc.pages.length + 1;
  }

  let newPage = {
    name: action.pageName,
    content: '',
    destImagePath: '',
    config: {}
  };

  doc.pages.splice(insertIndex, 0, newPage);

  return [
    ...state.slice(0, index),
    Object.assign({}, doc),
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

  let doc = state.find(doc => doc.uuid === action.uuid);

  if (! doc) {
    return state;
  }

  let page = doc.pages[action.pageIndex];

  if (! page) {
    return state;
  }
  doc.changed = true;
  page.content = action.content;

  return state;
}
