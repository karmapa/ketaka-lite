import * as types from '../actions/AppActions';

const actionsMap = {
  [types.TOGGLE_READONLY]: toggleReadonly
};

export default function direction(state = false, action) {
  const reduceFn = actionsMap[action.type];
  return reduceFn ? reduceFn(state, action) : state;
}

function toggleReadonly(state) {
  return ! state;
}
