import * as consts from '../constants/AppConstants';
import Store from '../services/Store';
import {DIRECTION_HORIZONTAL, DIRECTION_VERTICAL} from '../constants/AppConstants';

const SET_CLOSE_CONFIRM_STATUS = 'ketaka-lite/app/SET_CLOSE_CONFIRM_STATUS';
const RECEIVE_SETTINGS = 'ketaka-lite/app/RECEIVE_SETTINGS';
const SET_APP_VERSION = 'ketaka-lite/app/SET_APP_VERSION';
const SET_ELECTRON_VERSION = 'ketaka-lite/app/SET_ELECTRON_VERSION';
const SET_HISTORY_PROCESSING_STATUS = 'ketaka-lite/app/SET_HISTORY_PROCESSING_STATUS';

const cacheSettings = Store.get('settings') || {};

const settings = {
  direction: cacheSettings.direction || consts.DIRECTION_HORIZONTAL,
  ewRatio: cacheSettings.ewRatio || 0.5,
  exceptionWords: cacheSettings.exceptionWords || [],
  fontSize: cacheSettings.fontSize || 1,
  inputMethod: cacheSettings.inputMethod || consts.INPUT_METHOD_SYSTEM,
  closeConfirmStatus: false,
  appVersion: '',
  electronVersion: '',
  letterSpacing: cacheSettings.letterSpacing || 1,
  lineHeight: cacheSettings.lineHeight || 1,
  nsRatio: cacheSettings.nsRatio || 0.5,
  readonly: cacheSettings.readonly || false,
  shortcuts: Object.assign({}, consts.DEFAULT_SHORTCUTS, cacheSettings.shortcuts),
  showImageOnly: cacheSettings.showImageOnly || false,
  showTextOnly: cacheSettings.showTextOnly || false,
  spellCheckOn: cacheSettings.spellCheckOn || false,
  theme: cacheSettings.theme || 'default',
  isProcessingHistory: false
};

const actionsMap = {

  [RECEIVE_SETTINGS]: (state, action) => {
    return Object.assign({}, state, action.settings);
  },

  [SET_CLOSE_CONFIRM_STATUS]: (state, action) => {
    return Object.assign({}, state, {closeConfirmStatus: action.closeConfirmStatus});
  },

  [SET_APP_VERSION]: (state, action) => {
    return Object.assign({}, state, {appVersion: action.appVersion});
  },

  [SET_ELECTRON_VERSION]: (state, action) => {
    return Object.assign({}, state, {electronVersion: action.electronVersion});
  },

  [SET_HISTORY_PROCESSING_STATUS]: (state, action) => {
    return Object.assign({}, state, {isProcessingHistory: action.isProcessingHistory});
  }

};

export default function reducer(state = settings, action) {
  const reduceFn = actionsMap[action.type];
  return reduceFn ? reduceFn(state, action) : state;
}

export function setHistoryProcessingStatus(isProcessingHistory) {
  return {
    type: SET_HISTORY_PROCESSING_STATUS,
    isProcessingHistory
  };
}

export function setCloseConfirmStatus(closeConfirmStatus) {
  return {
    type: SET_CLOSE_CONFIRM_STATUS,
    closeConfirmStatus
  };
}

export function setAppVersion(appVersion) {
  return {
    type: SET_APP_VERSION,
    appVersion
  };
}

export function setElectronVersion(electronVersion) {
  return {
    type: SET_ELECTRON_VERSION,
    electronVersion
  };
}

export function toggleDirection() {
  return dispatch => {

    const settings = Store.get('settings') || {};

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
    const settings = Store.get('settings') || {};

    settings.inputMethod = inputMethod;
    Store.set('settings', settings);
    dispatch(receiveSettings(settings));
  };
}

export function setImageOnly(status) {
  return dispatch => {
    const settings = Store.get('settings') || {};

    settings.showImageOnly = status;
    Store.set('settings', settings);
    dispatch(receiveSettings(settings));
  };
}

export function setTextOnly(status) {
  return dispatch => {
    const settings = Store.get('settings') || {};

    settings.showTextOnly = status;
    Store.set('settings', settings);
    dispatch(receiveSettings(settings));
  };
}

export function toggleReadonly() {
  return dispatch => {
    const settings = Store.get('settings') || {};

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

    const settings = Store.get('settings') || {};

    settings.fontSize = fontSize;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function setLineHeight(lineHeight) {
  return dispatch => {

    const settings = Store.get('settings') || {};

    settings.lineHeight = lineHeight;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function setLetterSpacing(letterSpacing) {
  return dispatch => {

    const settings = Store.get('settings') || {};

    settings.letterSpacing = letterSpacing;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function setRatio(ratio, direction = DIRECTION_HORIZONTAL) {
  return dispatch => {

    const settings = Store.get('settings') || {};

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

    const settings = Store.get('settings') || {};

    settings.spellCheckOn = ! settings.spellCheckOn;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function setSpellCheck(status) {
  return dispatch => {

    const settings = Store.get('settings') || {};

    settings.spellCheckOn = status;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}

export function updateSettings(newSettings) {
  return dispatch => {

    const settings = Store.get('settings') || {};
    newSettings = Object.assign({}, settings, newSettings);
    Store.set('settings', newSettings);

    dispatch(receiveSettings(newSettings));
  };
}

export function initSettings() {
  return dispatch => {
    const settings = Store.get('settings') || {};
    dispatch(receiveSettings(settings));
  };
}

export function setExceptionWords(words) {
  return dispatch => {

    const settings = Store.get('settings') || {};
    settings.exceptionWords = words;
    Store.set('settings', settings);

    dispatch(receiveSettings(settings));
  };
}
