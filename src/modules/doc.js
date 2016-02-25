import Api from '../services/Api';
import _ from 'lodash';
import naturalSort from 'javascript-natural-sort';
import {REGEXP_PAGE} from '../constants/AppConstants';

const ADD_PAGE = 'ADD_PAGE';
const CLOSE_DOC = 'CLOSE_DOC';
const DELETE_PAGE = 'DELETE_PAGE';
const EXPORT_DATA = 'EXPORT_DATA';
const IMPORT_DATA = 'IMPORT_DATA';
const IMPORT_DOC = 'IMPORT_DOC';
const RECEIVE_DOC = 'RECEIVE_DOC';
const SAVE = 'SAVE';
const SAVE_FONT_RECORD = 'SAVE_FONT_RECORD';
const SET_PAGE_INDEX = 'SET_PAGE_INDEX';
const TO_NEXT_PAGE = 'TO_NEXT_PAGE';
const TO_PREVIOUS_PAGE = 'TO_PREVIOUS_PAGE';
const UPDATE_PAGE_IMAGE_PATH = 'UPDATE_PAGE_IMAGE_PATH';
const WRITE_PAGE_CONTENT = 'WRITE_PAGE_CONTENT';

const actionsMap = {

  [ADD_PAGE]: (state, action) => {

    let {doc, index} = findDocDataByUuid(state, action.uuid);

    if (! doc) {
      return state;
    }

    let insertIndex = findPageInsertIndex(doc.pages, action.pageName);

    let newPage = {
      name: action.pageName,
      content: '',
      pathData: {},
      config: {}
    };

    doc.pages.splice(insertIndex, 0, newPage);
    doc.changed = true;

    return [
      ...state.slice(0, index),
      Object.assign({}, doc),
      ...state.slice(index + 1)
    ];
  },

  [CLOSE_DOC]: (state, action) => {
    return state.filter(doc => {
      return doc.uuid !== action.uuid;
    });
  },

  [DELETE_PAGE]: (state, action) => {

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
  },

  [EXPORT_DATA]: (state, action) => state,

  [IMPORT_DATA]: (state, action) => state,

  [IMPORT_DOC]: (state, action) => {

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
  },

  [RECEIVE_DOC]: (state, action) => {

    let {doc, index} = findDocDataByUuid(state, action.doc.uuid);

    // override existed doc
    if (doc) {
      return [
        ...state.slice(0, index),
        Object.assign({}, action.doc),
        ...state.slice(index + 1)
      ];
    }
    console.log('here inside', [...state, action.doc]);
    return [...state, action.doc];
  },

  [SAVE]: (state, action) => {

    let {index, doc} = findDocDataByUuid(state, action.uuid);

    if (! doc) {
      return state;
    }
    return [
      ...state.slice(0, index),
      Object.assign({}, state[index], {changed: false}),
      ...state.slice(index + 1)
    ];
  },

  [SAVE_FONT_RECORD]: (state, action) => {

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
  },

  [SET_PAGE_INDEX]: (state, action) => {

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
  },

  [TO_NEXT_PAGE]: (state, action) => {

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
  },

  [TO_PREVIOUS_PAGE]: (state, action) => {

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
  },

  [UPDATE_PAGE_IMAGE_PATH]: (state, action) => {

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
  },

  [WRITE_PAGE_CONTENT]: (state, action) => {

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
};

export default function reducer(state = [], action) {
  const reduceFn = actionsMap[action.type];
  return reduceFn ? reduceFn(state, action) : state;
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

export function importData() {
  return {
    type: IMPORT_DATA
  };
}

export function save(uuid) {
  return {
    type: SAVE,
    uuid
  };
}

export function exportData() {
  return {
    type: EXPORT_DATA
  };
}

export function receiveDoc(doc) {
  return {
    type: RECEIVE_DOC,
    doc
  };
}

export function createDoc() {
  return dispatch => {
    Api.send('add-doc')
      .then(res => dispatch(receiveDoc(res.doc)));
  };
}

export function addPage(uuid, pageName) {
  return {
    type: ADD_PAGE,
    uuid,
    pageName
  };
}

export function importDoc(doc) {
  return {
    type: IMPORT_DOC,
    doc
  };
}

export function closeDoc(uuid) {
  return {
    type: CLOSE_DOC,
    uuid
  };
}

export function toNextPage(uuid) {
  return {
    type: TO_NEXT_PAGE,
    uuid
  };
}

export function toPreviousPage(uuid) {
  return {
    type: TO_PREVIOUS_PAGE,
    uuid
  };
}

export function setPageIndex(uuid, pageIndex) {
  return {
    type: SET_PAGE_INDEX,
    uuid,
    pageIndex
  };
}

export function writePageContent(uuid, pageIndex, content) {
  return {
    type: WRITE_PAGE_CONTENT,
    uuid,
    pageIndex,
    content
  };
}

export function saveFontRecord(uuid, pageIndex, fontRecords) {
  return {
    type: SAVE_FONT_RECORD,
    uuid,
    pageIndex,
    fontRecords
  };
}

export function deletePage(uuid, pageIndex) {
  return {
    type: DELETE_PAGE,
    uuid,
    pageIndex
  };
}

export function updatePageImagePath(uuid, pageIndex, pathData) {
  return {
    type: UPDATE_PAGE_IMAGE_PATH,
    uuid,
    pageIndex,
    pathData
  };
}
