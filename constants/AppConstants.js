
export const APP_NAME = 'KETAKA Lite';

export const KEY_ENTER = 13;

export const DIRECTION_HORIZONTAL = 1;
export const DIRECTION_VERTICAL = 2;

export const EVENT_SAVE = 'EVENT_SAVE';
export const EVENT_IMPORT = 'EVENT_IMPORT';
export const EVENT_OPEN_DOC = 'EVENT_OPEN_DOC';
export const EVENT_EXPORT_DATA = 'EVENT_EXPORT_DATA';

export const INPUT_METHOD_SYSTEM = 'System Input';
export const INPUT_METHOD_TIBETAN_EWTS = 'Tibetan EWTS';
export const INPUT_METHOD_TIBETAN_SAMBHOTA = 'Tibetan Sambhota1';
export const INPUT_METHOD_TIBETAN_SAMBHOTA2 = 'Tibetan Sambhota2';

export const MAP_INPUT_METHODS = {
  [INPUT_METHOD_SYSTEM]: '',
  [INPUT_METHOD_TIBETAN_EWTS]: 'BoEwts',
  [INPUT_METHOD_TIBETAN_SAMBHOTA]: 'BoSambhota',
  [INPUT_METHOD_TIBETAN_SAMBHOTA2]: 'BoSambhotaTwo'
};

export const MAP_COLORS = {
  'turquoise': '#1abc9c',
  'emerald': '#2ecc71',
  'peter-river': '#3498db',
  'amethyst': '#9b59b6',
  'black': '#000000',
  'sun-flower': '#f1c40f',
  'carrot': '#e67e22',
  'alizarin': '#99505f',
  'silver': '#bdc3c7',
  'asbestos': '#7f8c8d'
};

export const CHUNK_SIZE = 800;

export const REGEXP_PAGE = new RegExp('^(\\d+)\\.(\\d+)([abcd])$');


export const NON_EDITOR_AREA_HEIGHT = 60;
export const RESIZER_SIZE = 15;

export const DEFAULT_SHORTCUTS = {
  addTab: {
    text: 'Add a new tab',
    value: 'cmd + j'
  },
  closeTab: {
    text: 'Close current tab',
    value: 'cmd + k'
  },
  prevTab: {
    text: 'Switch to previous tab',
    value: 'ctrl + alt + left'
  },
  nextTab: {
    text: 'Switch to next tab',
    value: 'ctrl + alt + right'
  },
  save: {
    text: 'Save current bamboo',
    value: 'ctrl + s'
  },
  switchInputMethod: {
    text: 'Switch input method',
    value: 'alt + space'
  },
  find: {
    text: 'Find',
    value: 'ctrl + f'
  },
  findNext: {
    text: 'Find Next',
    value: 'enter'
  },
  findPrev: {
    text: 'Find Previous',
    value: 'shift + enter'
  },
  replace: {
    text: 'Replace',
    value: 'shift + ctrl + f'
  },
  confirmReplace: {
    text: 'Confirm replace',
    value: 'y'
  },
  confirmReject: {
    text: 'Confirm reject',
    value: 'n'
  },
  stop: {
    text: 'Stop',
    value: 'esc'
  },
  replaceAll: {
    text: 'Replace all',
    value: 'shift + enter'
  },
  splitPage: {
    text: 'Split page',
    value: 'ctrl + enter'
  },
  nextWord: {
    text: 'Next word',
    value: 'ctrl + g'
  },
  prevWord: {
    text: 'Previous word',
    value: 'alt + g'
  }
};
