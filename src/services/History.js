import {isPlainObject} from 'lodash';

export default class History {

  static data = {};

  static add(key, action) {
    console.log(key, action);
    this.autoCreateStructure(key);
    this.data[key].done.push(action);
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

    const data = this.data[key];

    if (! data) {
      return false;
    }

    let action = data.done.pop();

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
          content = content.substring(0, row.from) + row.value + content.substring(row.to);
        }
      });

    cm.disableHistory = true;
    cm.setValue(content);

    data.undone.push(action);
  }

  static redo(key, cm) {

    const data = this.data[key];

    if (! data) {
      return false;
    }

    const action = data.undone.pop();

    if (! action) {
      return false;
    }

    let content = cm.getValue();

    action.reverse()
      .forEach(row => {
        if (row.added) {
          content = content.substring(0, row.from) + row.value + content.substring(row.to);
        }
        else if (row.removed) {
          content = content.substring(0, row.from) + content.substring(row.to);
        }
      });

    cm.disableHistory = true;
    cm.setValue(content);

    data.done.push(action);
  }

}
