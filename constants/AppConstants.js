
export const APP_NAME = 'KETAKA Lite';

export const KEY_ENTER = 13;

export const DIRECTION_HORIZONTAL = false;
export const DIRECTION_VERTICAL = true;

export const TOGGLE_DIRECTION = 'TOGGLE_DIRECTION';
export const TOGGLE_READONLY = 'TOGGLE_READONLY';

export const EVENT_SAVE = 'EVENT_SAVE';
export const EVENT_IMPORT = 'EVENT_IMPORT';
export const EVENT_OPEN_DOC = 'EVENT_OPEN_DOC';
export const EVENT_ACTIVATE_TAB = 'EVENT_ACTIVATE_TAB';

export const PB_FILENAME_REGEXP = new RegExp('^(.+)_PB\.xml$');

export const INPUT_METHOD_SYSTEM = 'System Input';
export const INPUT_METHOD_TIBETAN_EWTS = 'Tibetan EWTS';
export const INPUT_METHOD_TIBETAN_SAMBHOTA = 'Tibetan Sambhota';
export const INPUT_METHOD_TIBETAN_SAMBHOTA2 = 'Tibetan Sambhota2';

export const MAP_INPUT_METHODS = {
  [INPUT_METHOD_SYSTEM]: '',
  [INPUT_METHOD_TIBETAN_EWTS]: 'BoEwts',
  [INPUT_METHOD_TIBETAN_SAMBHOTA]: 'BoSambhota',
  [INPUT_METHOD_TIBETAN_SAMBHOTA2]: 'BoSambhotaTwo'
};
