import * as types from '../actions/AppActions';
import * as consts from '../constants/AppConstants';
import Store from '../services/Store';

let cacheSettings = Store.get('settings') || {};

const settings = {
  fontSize: cacheSettings.fontSize || 1,
  letterSpacing: cacheSettings.letterSpacing || 1,
  lineHeight: cacheSettings.lineHeight || 1,
  direction: cacheSettings.direction || consts.DIRECTION_HORIZONTAL,
  nsRatio: cacheSettings.nsRatio || 0.5,
  ewRatio: cacheSettings.ewRatio || 0.5,
  showImageOnly: cacheSettings.showImageOnly || false,
  showTextOnly: cacheSettings.showTextOnly || false,
  exceptionWords: cacheSettings.exceptionWords || [],
  shortcuts: cacheSettings.shortcuts || consts.DEFAULT_SHORTCUTS,
  inputMethod: cacheSettings.inputMethod || consts.INPUT_METHOD_SYSTEM,
  spellCheckOn: cacheSettings.spellCheckOn || false,
  readonly: cacheSettings.readonly || false,
  theme: cacheSettings.theme || 'default'
};

const actionsMap = {
  [types.RECEIVE_SETTINGS]: receiveSettings
};

export default function(state = settings, action) {
  const reduceFn = actionsMap[action.type];
  return reduceFn ? reduceFn(state, action) : state;
}

function receiveSettings(state, action) {
  return Object.assign({}, state, action.settings);
}
