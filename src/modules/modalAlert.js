const CLOSE_MODAL = 'ketaka-lite/modalAlert/CLOSE_MODAL';
const OPEN_MODAL = 'ketaka-lite/modalAlert/OPEN_MODAL';

const initialState = {
  title: '',
  message: '',
  isModalVisible: false
};

const actionsMap = {

  [OPEN_MODAL]: (state, action) => Object.assign({}, state, {isModalVisible: action.isModalVisible, title: action.title, message: action.message}),

  [CLOSE_MODAL]: (state, action) => Object.assign({}, state, {isModalVisible: action.isModalVisible})

};

export default function reducer(state = initialState, action) {
  const reduceFn = actionsMap[action.type];
  return reduceFn ? reduceFn(state, action) : state;
}

export function openModal({title, message}) {
  return {
    type: OPEN_MODAL,
    isModalVisible: true,
    title,
    message
  };
}

export function closeModal() {
  return {
    type: CLOSE_MODAL,
    isModalVisible: false
  };
}
