import Api from '../services/Api';
import {isArray} from 'lodash';
import naturalSort from 'javascript-natural-sort';
import uuid from 'node-uuid';
import {REGEXP_PAGE} from '../constants/AppConstants';

const ADD_PAGE = 'ketaka-Lite/doc/ADD_PAGE';
const CLOSE_DOC = 'ketaka-Lite/doc/CLOSE_DOC';
const DELETE_PAGE = 'ketaka-Lite/doc/DELETE_PAGE';
const EXPORT_DATA = 'ketaka-Lite/doc/EXPORT_DATA';
const IMPORT_DATA = 'ketaka-Lite/doc/IMPORT_DATA';
const IMPORT_DOC = 'ketaka-Lite/doc/IMPORT_DOC';
const RECEIVE_DOC = 'ketaka-Lite/doc/RECEIVE_DOC';
const SAVE = 'ketaka-Lite/doc/SAVE';
const SAVE_FONT_RECORD = 'ketaka-Lite/doc/SAVE_FONT_RECORD';
const SET_PAGE_INDEX = 'ketaka-Lite/doc/SET_PAGE_INDEX';
const TO_NEXT_PAGE = 'ketaka-Lite/doc/TO_NEXT_PAGE';
const TO_PREVIOUS_PAGE = 'ketaka-Lite/doc/TO_PREVIOUS_PAGE';
const UPDATE_PAGE_IMAGE_PATH = 'ketaka-Lite/doc/UPDATE_PAGE_IMAGE_PATH';
const WRITE_PAGE_CONTENT = 'ketaka-Lite/doc/WRITE_PAGE_CONTENT';
const CLEAR_DOC_PAGE_IMAGE = 'ketaka-Lite/doc/CLEAR_DOC_PAGE_IMAGE';

const actionsMap = {

  [ADD_PAGE]: (state, action) => {

    const {doc, index} = findDocDataByUuid(state, action.uuid);

    if (! doc) {
      return state;
    }

    const insertIndex = findPageInsertIndex(doc.pages, action.pageName);

    const newPage = {
      uuid: uuid.v4(),
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

  [CLEAR_DOC_PAGE_IMAGE]: (state, action) => {

    const {doc, index} = findDocDataByName(state, action.docName);
    const page = doc.pages[doc.pageIndex];
    doc.changed = true;
    page.pathData = {};

    return [
      ...state.slice(0, index),
      Object.assign({}, doc),
      ...state.slice(index + 1)
    ];
  },

  [DELETE_PAGE]: (state, action) => {

    const {doc, index} = findDocDataByUuid(state, action.uuid);
    const {pageIndex} = action;

    if (! doc) {
      return state;
    }

    const page = doc.pages[pageIndex];

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

    const {doc, index} = findDocDataByName(state, action.doc.name);

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

    const {doc, index} = findDocDataByUuid(state, action.doc.uuid);

    // override existed doc
    if (doc) {
      return [
        ...state.slice(0, index),
        Object.assign({}, action.doc),
        ...state.slice(index + 1)
      ];
    }
    return [...state, action.doc];
  },

  [SAVE]: (state, action) => {

    const {index, doc} = findDocDataByUuid(state, action.uuid);

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

    const doc = state.find(doc => doc.uuid === action.uuid);

    if (! doc) {
      return state;
    }

    const page = doc.pages[action.pageIndex];

    if (! page) {
      return state;
    }

    if (! isArray(page.config.fontRecords)) {
      page.config.fontRecords = [];
    }

    page.config.fontRecords = page.config.fontRecords.concat(action.fontRecords);

    return Object.assign([], state);
  },

  [SET_PAGE_INDEX]: (state, action) => {

    const {doc, index} = findDocDataByUuid(state, action.uuid);
    const pageIndex = action.pageIndex;

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

    const {doc, index} = findDocDataByUuid(state, action.uuid);

    if (! doc) {
      return state;
    }

    const nextPageIndex = doc.pageIndex + 1;

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

    const {doc, index} = findDocDataByUuid(state, action.uuid);

    if (! doc) {
      return state;
    }

    const previousPageIndex = doc.pageIndex - 1;

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

    const {doc, index} = findDocDataByUuid(state, action.uuid);
    const {pageIndex} = action;

    if (! doc) {
      return state;
    }

    const page = doc.pages[pageIndex];

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

    const {doc, index} = findDocDataByUuid(state, action.uuid);

    if (! doc) {
      return state;
    }

    const page = doc.pages[action.pageIndex];

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
  const isInsertPageValid = REGEXP_PAGE.test(pageName);

  const validPages = pages.filter(page => REGEXP_PAGE.test(page.name));
  const inValidPages = pages.filter(page => ! REGEXP_PAGE.test(page.name));

  if (isInsertPageValid) {
    for (let i = 0, len = validPages.length; i < len; i++) {

      const page = validPages[i];
      const res = naturalSort(pageName, page.name);

      if (-1 === res) {
        return i;
      }

    }
    return validPages.length;
  }
  else {
    for (let i = 0, len = inValidPages.length; i < len; i++) {

      const page = inValidPages[i];
      const res = naturalSort(pageName, page.name);

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
  const foundDoc = docs.find((doc, index) => {
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

export function clearDocPageImage(docName) {
  return {
    type: CLEAR_DOC_PAGE_IMAGE,
    docName
  };
}

export function createDoc() {
  return dispatch => {
    return Api.send('add-doc')
      .then(res => dispatch(receiveDoc(res.doc)));
  };
}

export function deletePageImage({docName, imageFilename}) {
  return dispatch => {
    return Api.send('delete-page-image', {docName, imageFilename})
      .then(res => dispatch(clearDocPageImage(docName)));
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
