import _ from 'lodash';
import Store from '../services/Store';

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

export const RECEIVE_SETTINGS = 'RECEIVE_SETTINGS';

export function receiveSettings(settings) {
  return {
    type: RECEIVE_SETTINGS,
    settings
  };
}

export const SET_FONT_SIZE = 'SET_FONT_SIZE';

export function setFontSize(fontSize) {
  return dispatch => {

    let settings = Store.get('settings') || {};

    settings.fontSize = fontSize;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export const INIT_SETTINGS = 'INIT_SETTINGS';

export function initSettings() {
  return dispatch => {
    let settings = Store.get('settings') || {};
    dispatch(receiveSettings(settings));
  };
}
