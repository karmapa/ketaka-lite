import {isPlainObject, find, get, each} from 'lodash';

const jsdiff = require('diff');

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

  static undo(key, rawContent) {

    if (! (key in this.data)) {
      return false;
    }

    const {done, undone} = this.data[key];
    const action = done.pop();

    if (! action) {
      return false;
    }

    let content = rawContent;

    const addedRow = find(action, {added: true});
    const removedRow = find(action, {removed: true});

    if (addedRow) {
      content = content.substring(0, addedRow.from) + content.substring(addedRow.to);
    }
    if (removedRow) {
      content = content.substring(0, removedRow.from) + removedRow.value + content.substring(removedRow.from);
    }
    undone.push(action);
    this.data[key].undone = undone.slice(-HISTORY_SIZE);

    return {content, addedRow, removedRow};
  }

  static redo(key, rawContent) {

    if (! (key in this.data)) {
      return false;
    }

    const {done, undone} = this.data[key];
    const action = undone.pop();

    if (! action) {
      return false;
    }

    let content = rawContent;
    const addedRow = find(action, {added: true});
    const removedRow = find(action, {removed: true});

    if (removedRow) {
      content = content.substring(0, removedRow.from) + content.substring(removedRow.to);
    }
    if (addedRow) {
      content = content.substring(0, addedRow.from) + addedRow.value + content.substring(addedRow.from);
    }

    done.push(action);
    this.data[key].undone = undone.slice(-HISTORY_SIZE);

    return {content, addedRow, removedRow}
  }

  static getActionByContents(content1, content2) {

    const diffRows = jsdiff.diffLines(content1, content2);

    let pos = 0;
    const action = [];

    let addedRow = null;
    let removedRow = null;

    each(diffRows, diffRow => {

      const diffRowValueLength = diffRow.value.length;

      if (diffRow.added) {
        addedRow = {
          added: true,
          value: diffRow.value,
          from: pos,
          to: pos + diffRowValueLength
        };
      }
      else if (diffRow.removed) {

        removedRow = {
          removed: true,
          value: diffRow.value,
          from: pos,
          to: pos + diffRowValueLength
        };
      }
      else {
        pos += diffRowValueLength;
      }
    });

    let charRow = null;

    if (addedRow && removedRow) {
      charRow = this.diffChars(removedRow, addedRow);
    }

    if (charRow && charRow.added) {
      addedRow.charRow = charRow;
    }
    if (charRow && charRow.removed) {
      removedRow.charRow = charRow;
    }

    if (addedRow) {
      action.push(addedRow);
    }

    if (removedRow) {
      action.push(removedRow);
    }

    return action;
  }

  static diffChars(addedLineRow, removedLineRow) {

    const rows = jsdiff.diffChars(addedLineRow.value, removedLineRow.value);

    // paste
    if (rows.length > 3) {
      return null;
    }

    const addedRow = find(rows, {added: true});
    const removedRow = find(rows, {removed: true});

    // paste
    if (addedRow && removedRow) {
      return null;
    }

    let pos = 0;

    each(rows, row => {

      if (row.added) {
        addedRow.from = addedLineRow.from + pos;
        addedRow.to = addedRow.from + addedRow.value.length;
      }
      else if (row.removed) {
        removedRow.from = removedLineRow.from + pos;
        removedRow.to = removedRow.from + removedRow.value.length;
      }
      else {
        pos += row.count;
      }
    });

    return addedRow || removedRow;
  }

}
