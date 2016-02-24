import * as consts from '../constants/AppConstants';
import Store from '../services/Store';
import {DIRECTION_HORIZONTAL, DIRECTION_VERTICAL} from '../constants/AppConstants';

const RECEIVE_SETTINGS = 'RECEIVE_SETTINGS';

let cacheSettings = Store.get('settings') || {};

const settings = {
  direction: cacheSettings.direction || consts.DIRECTION_HORIZONTAL,
  ewRatio: cacheSettings.ewRatio || 0.5,
  exceptionWords: cacheSettings.exceptionWords || [],
  fontSize: cacheSettings.fontSize || 1,
  inputMethod: cacheSettings.inputMethod || consts.INPUT_METHOD_SYSTEM,
  letterSpacing: cacheSettings.letterSpacing || 1,
  lineHeight: cacheSettings.lineHeight || 1,
  nsRatio: cacheSettings.nsRatio || 0.5,
  readonly: cacheSettings.readonly || false,
  shortcuts: cacheSettings.shortcuts || consts.DEFAULT_SHORTCUTS,
  showImageOnly: cacheSettings.showImageOnly || false,
  showTextOnly: cacheSettings.showTextOnly || false,
  spellCheckOn: cacheSettings.spellCheckOn || false,
  theme: cacheSettings.theme || 'default'
};

const actionsMap = {
  [RECEIVE_SETTINGS]: receiveSettings
};

export default function reducer(state = settings, action) {
  const reduceFn = actionsMap[action.type];
  return reduceFn ? reduceFn(state, action) : state;
}

function receiveSettings(state, action) {
  return Object.assign({}, state, action.settings);
}

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

export function setExceptionWords(words) {
  return dispatch => {

    let settings = Store.get('settings') || {};
    settings.exceptionWords = words;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}
