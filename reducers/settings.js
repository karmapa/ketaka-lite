import * as types from '../actions/AppActions';

const settings = {
  fontSize: 1,
  letterSpacing: 1,
  lineHeight: 1
};

const actionsMap = {
  [types.RECEIVE_SETTINGS]: receiveSettings
};

export default function fontSize(state = settings, action) {
  const reduceFn = actionsMap[action.type];
  return reduceFn ? reduceFn(state, action) : state;
}

function receiveSettings(state, action) {
  return Object.assign({}, state, action.settings);
}
