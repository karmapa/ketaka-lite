import {isPlainObject} from 'lodash';

const HISTORY_SIZE = 200;

export default class History {

  static data = {};

  static add(key, action) {
    this.autoCreateStructure(key);
    const {done} = this.data[key];
    done.push(action);
    this.data[key].done = done.slice(-HISTORY_SIZE);
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

    action.reverse()
      .forEach(row => {
        if (row.added) {
          content = content.substring(0, row.from) + content.substring(row.to);
        }
        else if (row.removed) {
          content = content.substring(0, row.from) + row.value + content.substring(row.from);
        }
      });

    cm.disableHistory = true;
    cm.setValue(content);

    undone.push(action);
    this.data[key].undone = undone.slice(-HISTORY_SIZE);
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

    action.reverse()
      .forEach(row => {
        if (row.added) {
          content = content.substring(0, row.from) + row.value + content.substring(row.from);
        }
        else if (row.removed) {
          content = content.substring(0, row.from) + content.substring(row.to);
        }
      });

    cm.disableHistory = true;
    cm.setValue(content);

    done.push(action);
    this.data[key].undone = undone.slice(-HISTORY_SIZE);
  }

}
