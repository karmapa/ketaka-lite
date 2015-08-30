import * as constants from '../constants/AppConstants';

const actionsMap = {
  [constants.TOGGLE_DIRECTION]: toggleDirection
};

export default function direction(state = constants.DIRECTION_HORIZONTAL, action) {
  const reduceFn = actionsMap[action.type];
  return reduceFn ? reduceFn(state, action) : state;
}

function toggleDirection(state) {
  return ! state;
}
