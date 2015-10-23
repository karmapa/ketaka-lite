import EventEmitter from 'eventemitter3';
import {EVENT_SAVE, EVENT_IMPORT, EVENT_OPEN_DOC, EVENT_EXPORT_DATA} from '../constants/AppConstants';

export default class DocHelper {

  static ee = new EventEmitter();

  static save() {
    DocHelper.ee.emit(EVENT_SAVE);
  }

  static onSave(fn) {
    DocHelper.ee.on(EVENT_SAVE, fn);
  }

  static offSave(fn) {
    DocHelper.ee.off(EVENT_SAVE, fn);
  }

  static import() {
    DocHelper.ee.emit(EVENT_IMPORT);
  }

  static onImport(fn) {
    DocHelper.ee.on(EVENT_IMPORT, fn);
  }

  static offImport(fn) {
    DocHelper.ee.off(EVENT_IMPORT, fn);
  }

  static openDoc() {
    DocHelper.ee.emit(EVENT_OPEN_DOC);
  }

  static onOpenDoc(fn) {
    DocHelper.ee.on(EVENT_OPEN_DOC, fn);
  }

  static offOpenDoc(fn) {
    DocHelper.ee.off(EVENT_OPEN_DOC, fn);
  }

  static exportData(args) {
    DocHelper.ee.emit(EVENT_EXPORT_DATA, args);
  }

  static onExportData(fn) {
    DocHelper.ee.on(EVENT_EXPORT_DATA, fn);
  }

  static offExportData(fn) {
    DocHelper.ee.off(EVENT_EXPORT_DATA, fn);
  }
}
