import Api from '../services/Api';

const CLOSE_MODAL = 'ketaka-lite/modalEditDocs/CLOSE_MODAL';
const OPEN_MODAL = 'ketaka-lite/modalEditDocs/OPEN_MODAL';
const LOAD_SUCCESS = 'ketaka-lite/modalEditDocs/LOAD_SUCCESS';
const SET_DOCS = 'ketaka-lite/modalEditDocs/SET_DOCS';
const SHOW_WARNING = 'ketaka-lite/modalEditDocs/SHOW_WARNING';
const HIDE_WARNING = 'ketaka-lite/modalEditDocs/HIDE_WARNING';


const initialState = {
  docs: [],
  isWarningVisible: false,
  isModalVisible: false
};

const actionsMap = {

  [OPEN_MODAL]: (state, action) => Object.assign({}, state, {isModalVisible: action.isModalVisible}),

  [CLOSE_MODAL]: (state, action) => Object.assign({}, state, {isModalVisible: action.isModalVisible}),

  [LOAD_SUCCESS]: (state, action) => Object.assign({}, state, {docs: action.docs}),

  [SET_DOCS]: (state, action) => Object.assign({}, state, {docs: action.docs}),

  [SHOW_WARNING]: (state, action) => Object.assign({}, state, {isWarningVisible: action.isWarningVisible}),

  [HIDE_WARNING]: (state, action) => Object.assign({}, state, {isWarningVisible: action.isWarningVisible})

};

export default function reducer(state = initialState, action) {
  const reduceFn = actionsMap[action.type];
  return reduceFn ? reduceFn(state, action) : state;
}

export function openModal() {
  return {
    type: OPEN_MODAL,
    isModalVisible: true
  };
}

export function closeModal() {
  return {
    type: CLOSE_MODAL,
    isModalVisible: false
  };
}

export function setDocs(docs) {
  return {
    type: SET_DOCS,
    docs
  };
}

export function showWarning() {
  return {
    type: SHOW_WARNING,
    isWarningVisible: true
  };
}

export function hideWarning() {
  return {
    type: HIDE_WARNING,
    isWarningVisible: false
  };
}

export function loadDocNames() {

  return dispatch => {
    return Api.send('list-doc-name')
      .then(res => dispatch({
        type: LOAD_SUCCESS,
        docs: res.docNames.map(name => ({name, checked: false}))
      }));
  };
}
