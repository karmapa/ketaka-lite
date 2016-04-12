import {isPlainObject, find, get} from 'lodash';

const HISTORY_SIZE = 200;

export default class History {

  static data = {};

  static add(key, action) {
    this.autoCreateStructure(key);
    const {done} = this.data[key];
    done.push(action);
    this.data[key].done = done.slice(-HISTORY_SIZE);
    this.data[key].undone.length = 0;
  }

  static autoCreateStructure(key) {
    if (! isPlainObject(this.data[key])) {
      this.data[key] = {
        done: [],
        undone: []
      };
    }
  }

  static undo(key, cm) {

    if (! (key in this.data)) {
      return false;
    }

    const {done, undone} = this.data[key];
    const action = done.pop();

    if (! action) {
      return false;
    }

    let content = cm.getValue();

    const addedRow = find(action, {added: true});
    const removedRow = find(action, {removed: true});

    if (addedRow) {
      content = content.substring(0, addedRow.from) + content.substring(addedRow.to);
    }
    if (removedRow) {
      content = content.substring(0, removedRow.from) + removedRow.value + content.substring(removedRow.from);
    }

    cm.disableHistory = true;
    cm.setValue(content);
    this.setUndoCursor(cm, addedRow, removedRow);
    cm.focus();

    undone.push(action);
    this.data[key].undone = undone.slice(-HISTORY_SIZE);
  }

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

  static redo(key, cm) {

    if (! (key in this.data)) {
      return false;
    }

    const {done, undone} = this.data[key];
    const action = undone.pop();

    if (! action) {
      return false;
    }

    let content = cm.getValue();
    const addedRow = find(action, {added: true});
    const removedRow = find(action, {removed: true});

    if (removedRow) {
      content = content.substring(0, removedRow.from) + content.substring(removedRow.to);
    }
    if (addedRow) {
      content = content.substring(0, addedRow.from) + addedRow.value + content.substring(addedRow.from);
    }

    cm.disableHistory = true;
    cm.setValue(content);
    this.setRedoCursor(cm, addedRow, removedRow);
    cm.focus();

    done.push(action);
    this.data[key].undone = undone.slice(-HISTORY_SIZE);
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
