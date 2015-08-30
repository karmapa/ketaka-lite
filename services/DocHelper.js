import EventEmitter from 'eventemitter3';
import {EVENT_ON_SAVE, EVENT_ON_IMPORT} from '../constants/AppConstants';

export default class DocHelper {

  static ee = new EventEmitter();

  static save() {
    DocHelper.ee.emit(EVENT_ON_SAVE);
  }

  static import() {
    DocHelper.ee.emit(EVENT_ON_IMPORT);
  }

  static onSave(fn) {
    DocHelper.ee.on(EVENT_ON_SAVE, fn);
  }

  static offSave(fn) {
    DocHelper.ee.off(EVENT_ON_SAVE, fn);
  }

  static onImport(fn) {
    DocHelper.ee.on(EVENT_ON_IMPORT, fn);
  }

  static offImport(fn) {
    DocHelper.ee.off(EVENT_ON_IMPORT, fn);
  }
}
