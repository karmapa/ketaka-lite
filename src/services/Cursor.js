import {get} from 'lodash';

export default class Cursor {

  static setUndoCursor(cm, addedRow, removedRow) {

    const addedCharRow = get(addedRow, 'charRow');
    const removedCharRow = get(removedRow, 'charRow');

    if (addedCharRow) {
      const pos = cm.posFromIndex(addedCharRow.from);
      cm.setCursor(pos);
    }
    else if (removedCharRow) {
      const pos = cm.posFromIndex(removedCharRow.to);
      cm.setCursor(pos);
    }
    else if (addedRow) {
      const pos = cm.posFromIndex(addedRow.from);
      cm.setCursor(pos);
    }
    else if (removedRow) {
      const pos = cm.posFromIndex(removedRow.to);
      cm.setCursor(pos);
    }
  }

  static setRedoCursor(cm, addedRow, removedRow) {

    const addedCharRow = get(addedRow, 'charRow');
    const removedCharRow = get(removedRow, 'charRow');

    if (addedCharRow) {
      const pos = cm.posFromIndex(addedCharRow.to);
      cm.setCursor(pos);
    }
    else if (removedCharRow) {
      const pos = cm.posFromIndex(removedCharRow.from);
      cm.setCursor(pos);
    }
    else if (addedRow) {
      const pos = cm.posFromIndex(addedRow.to);
      cm.setCursor(pos);
    }
    else if (removedRow) {
      const pos = cm.posFromIndex(removedRow.from);
      cm.setCursor(pos);
    }
  }

}
