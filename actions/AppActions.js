
export const TOGGLE_DIRECTION = 'TOGGLE_DIRECTION';

export function toggleDirection() {
  return {
    type: TOGGLE_DIRECTION
  };
}

export const SET_INPUT_METHOD = 'SET_INPUT_METHOD';

export function setInputMethod(inputMethod) {
  return {
    type: SET_INPUT_METHOD,
    inputMethod
  };
}

export const TOGGLE_READONLY = 'TOGGLE_READONLY';

export function toggleReadonly() {
  return {
    type: TOGGLE_READONLY
  };
}
