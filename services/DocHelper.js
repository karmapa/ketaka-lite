import EventEmitter from 'eventemitter3';
import {EVENT_ON_SAVE, EVENT_ON_IMPORT, EVENT_ON_OPEN_DOC} from '../constants/AppConstants';

export default class DocHelper {

  static ee = new EventEmitter();

  static save() {
    DocHelper.ee.emit(EVENT_ON_SAVE);
  }

  static onSave(fn) {
    DocHelper.ee.on(EVENT_ON_SAVE, fn);
  }

  static offSave(fn) {
    DocHelper.ee.off(EVENT_ON_SAVE, fn);
  }

  static import() {
    DocHelper.ee.emit(EVENT_ON_IMPORT);
  }

  static onImport(fn) {
    DocHelper.ee.on(EVENT_ON_IMPORT, fn);
  }

  static offImport(fn) {
    DocHelper.ee.off(EVENT_ON_IMPORT, fn);
  }

  static openDoc() {
    DocHelper.ee.emit(EVENT_ON_OPEN_DOC);
  }

  static onOpenDoc(fn) {
    DocHelper.ee.on(EVENT_ON_OPEN_DOC, fn);
  }

  static offOpenDoc(fn) {
    DocHelper.ee.off(EVENT_ON_OPEN_DOC, fn);
  }
}
