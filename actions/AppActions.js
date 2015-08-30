import * as types from '../constants/ActionTypes';

export function toggleDirection() {
  return {
    type: types.TOGGLE_DIRECTION
  };
}

export function setInputMethod(inputMethod) {
  return {
    type: types.SET_INPUT_METHOD,
    inputMethod
  };
}

export function toggleReadonly() {
  return {
    type: types.TOGGLE_READONLY
  };
}
