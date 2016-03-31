const CLOSE_MODAL = 'ketaka-lite/modalEditDocs/CLOSE_MODAL';
const OPEN_MODAL = 'ketaka-lite/modalEditDocs/OPEN_MODAL';

const initialState = {
  isModalVisible: false
};

const actionsMap = {

  [OPEN_MODAL]: (state, action) => Object.assign({}, state, {isModalVisible: action.isModalVisible}),

  [CLOSE_MODAL]: (state, action) => Object.assign({}, state, {isModalVisible: action.isModalVisible})

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
