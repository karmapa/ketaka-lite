import Store from '../services/Store';
import {DIRECTION_HORIZONTAL, DIRECTION_VERTICAL} from '../constants/AppConstants';

export function toggleDirection() {
  return dispatch => {

    let settings = Store.get('settings') || {};

    // init
    if (undefined === settings.direction) {
      settings.direction = DIRECTION_HORIZONTAL;
    }

    settings.direction = (DIRECTION_HORIZONTAL === settings.direction) ? DIRECTION_VERTICAL : DIRECTION_HORIZONTAL;

    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function setInputMethod(inputMethod) {
  return dispatch => {
    let settings = Store.get('settings') || {};

    settings.inputMethod = inputMethod;
    Store.set('settings', settings);
    dispatch(receiveSettings(settings));
  };
}

export function setImageOnly(status) {
  return dispatch => {
    let settings = Store.get('settings') || {};

    settings.showImageOnly = status;
    Store.set('settings', settings);
    dispatch(receiveSettings(settings));
  };
}

export function setTextOnly(status) {
  return dispatch => {
    let settings = Store.get('settings') || {};

    settings.showTextOnly = status;
    Store.set('settings', settings);
    dispatch(receiveSettings(settings));
  };
}

export function toggleReadonly() {
  return dispatch => {
    let settings = Store.get('settings') || {};

    settings.readonly = ! settings.readonly;
    Store.set('settings', settings);
    dispatch(receiveSettings(settings));
  };
}

export const RECEIVE_SETTINGS = 'RECEIVE_SETTINGS';

export function receiveSettings(settings) {
  return {
    type: RECEIVE_SETTINGS,
    settings
  };
}

export function setFontSize(fontSize) {
  return dispatch => {

    let settings = Store.get('settings') || {};

    settings.fontSize = fontSize;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function setLineHeight(lineHeight) {
  return dispatch => {

    let settings = Store.get('settings') || {};

    settings.lineHeight = lineHeight;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function setLetterSpacing(letterSpacing) {
  return dispatch => {

    let settings = Store.get('settings') || {};

    settings.letterSpacing = letterSpacing;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function setRatio(ratio, direction = DIRECTION_HORIZONTAL) {
  return dispatch => {

    let settings = Store.get('settings') || {};

    if (DIRECTION_HORIZONTAL === direction) {
      settings.nsRatio = ratio;
    }
    else {
      settings.ewRatio = ratio;
    }
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function toggleSpellCheck() {

  return dispatch => {

    let settings = Store.get('settings') || {};

    settings.spellCheckOn = ! settings.spellCheckOn;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function setSpellCheck(status) {
  return dispatch => {

    let settings = Store.get('settings') || {};

    settings.spellCheckOn = status;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function updateSettings(newSettings) {
  return dispatch => {

    let settings = Store.get('settings') || {};
    newSettings = Object.assign({}, settings, newSettings);
    Store.set('settings', newSettings);

    dispatch(receiveSettings(newSettings));
  };
}

export function initSettings() {
  return dispatch => {
    let settings = Store.get('settings') || {};
    dispatch(receiveSettings(settings));
  };
}

