import React, {PropTypes} from 'react';
import {first, get, find, findIndex, isEmpty, isNull, values,
  invert, clone, each, throttle, debounce, map} from 'lodash';
import classNames from 'classnames';
import keypress from 'keypress.js';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {DropdownButton, MenuItem} from 'react-bootstrap';
import {Editor, ImageZoomer, ImageUploader, TabBox, TabItem, ModalConfirm, ModalSaveConfirm,
  ModalDocSettings, ModalPageAdd, SearchBar, ModalSettings, ModalSaveAs,
  ModalImport, ModalOpen, ModalSpellCheckExceptionList, EditorToolbar, ModalEditDocs,
  Resizer, PrintArea} from '.';
import {Helper, Ime, History, Event, Api} from '../services/';
import CodeMirror from 'codemirror';

import {MAP_COLORS, MAP_INPUT_METHODS, DIRECTION_VERTICAL, DIRECTION_HORIZONTAL,
  NON_EDITOR_AREA_HEIGHT, RESIZER_SIZE, INPUT_METHOD_SYSTEM, INPUT_METHOD_TIBETAN_EWTS,
  INPUT_METHOD_TIBETAN_SAMBHOTA, INPUT_METHOD_TIBETAN_SAMBHOTA2} from '../constants/AppConstants';

import {ToastContainer, ToastMessage} from 'react-toastr';

import {checkSyllables} from 'check-tibetan';
import Path from 'path';
import {connect} from 'react-redux';

const ToastMessageFactory = React.createFactory(ToastMessage.animation);
const KEY_ADD_DOC = 'KEY_ADD_DOC';

import {setCloseConfirmStatus, setInputMethod, setImageOnly, setSpellCheck,
  setTextOnly, toggleSpellCheck} from '../modules/app';
import {addDoc, addPage, closeDoc, createDoc, deletePage, importDoc, saveFontRecord,
  receiveDoc, save, setPageIndex, updatePageImagePath, writePageContent} from '../modules/doc';
import uuid from 'node-uuid';

const jsdiff = require('diff');
const eventHelper = new Event();

@connect(state => ({
  closeConfirmStatus: state.app.closeConfirmStatus,
  direction: state.app.direction,
  docs: state.doc,
  ewRatio: state.app.ewRatio,
  exceptionWords: state.app.exceptionWords,
  inputMethod: state.app.inputMethod,
  nsRatio: state.app.nsRatio,
  shortcuts: state.app.shortcuts,
  showImageOnly: state.app.showImageOnly,
  showTextOnly: state.app.showTextOnly,
  spellCheckOn: state.app.spellCheckOn
}), {addDoc, addPage, closeDoc, createDoc, deletePage, importDoc,
  save, saveFontRecord, setPageIndex, updatePageImagePath, writePageContent, receiveDoc,
  setInputMethod, setImageOnly, setSpellCheck, setTextOnly, toggleSpellCheck, setCloseConfirmStatus})
export default class EditorArea extends React.Component {

  static PropTypes = {
    addDoc: PropTypes.func.isRequired,
    addPage: PropTypes.func.isRequired,
    closeConfirmStatus: PropTypes.bool.isRequired,
    closeDoc: PropTypes.func.isRequired,
    createDoc: PropTypes.func.isRequired,
    deletePage: PropTypes.func.isRequired,
    docs: PropTypes.array.isRequired,
    ewRatio: PropTypes.number.isRequired,
    exceptionWords: PropTypes.array.isRequired,
    importDoc: PropTypes.func.isRequired,
    inputMethod: PropTypes.string.isRequired,
    nsRatio: PropTypes.number.isRequired,
    receiveDoc: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired,
    saveFontRecord: PropTypes.func.isRequired,
    setImageOnly: PropTypes.func.isRequired,
    setInputMethod: PropTypes.func.isRequired,
    setPageIndex: PropTypes.func.isRequired,
    setSpellCheck: PropTypes.func.isRequired,
    setTextOnly: PropTypes.func.isRequired,
    shortcuts: PropTypes.object.isRequired,
    showImageOnly: PropTypes.bool.isRequired,
    showTextOnly: PropTypes.bool.isRequired,
    toggleSpellCheck: PropTypes.func.isRequired,
    updatePageImagePath: PropTypes.func.isRequired,
    writePageContent: PropTypes.func.isRequired
  };

  docPath = '';
  keypressListener = null;
  lastQueryRes = [];

  constructor(props, context) {
    super(props, context);

    const {docs} = this.props;

    this.state = {
      print: false,
      docKey: docs.length > 0 ? first(docs).uuid : null
    };

    this.isSaving = false;
  }

  componentWillMount() {

    const self = this;

    Api.send('get-app-data')
     .then(res => {
      self.docPath = res.docPath;
    });
  }

  closeModalSettings = () => {
    this.getSettingsModal().close();
    this.bindKeyboardEvents();
  };

  findMatchCountByKeyword = (keyword, index) => {
    const doc = this.getDoc();
    const pages = doc.pages;
    const page = pages[doc.pageIndex];
    const content = page.content.substring(index);

    keyword = keyword.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    const regexp = new RegExp(keyword, 'g');
    const match = content.match(regexp);
    let count = match ? match.length : 0;

    let pageIndex = doc.pageIndex;
    let nextPage = pages[++pageIndex];

    while (nextPage) {
      const content = nextPage.content;
      const match = content.match(regexp);
      count += match ? match.length : 0;
      nextPage = pages[++pageIndex];
    }

    return count;
  };

  handleSelect = key => {
    if (KEY_ADD_DOC === key) {
      return this.addDoc();
    }
    if (key !== this.state.docKey) {
      this.setState({
        docKey: key
      });
    }
  };

  activateTab(index) {
    const activeDoc = this.props.docs[index];

    this.setState({
      docKey: activeDoc ? activeDoc.uuid : null
    });
  }

  addDoc = () => this.props.createDoc();

  markFontColor(codemirror = this.getCurrentCodemirror(), page = this.getCurrentPage()) {

    if (! codemirror) {
      return false;
    }

    const fontRecords = get(page, 'config.fontRecords', []);
    fontRecords.forEach(record => {
      const {from, to, css} = record;
      codemirror.markText(from, to, css);
    });
  }

  componentDidUpdate(previousProps, previousState) {

    const docs = this.props.docs;
    const codemirror = this.getCurrentCodemirror();

    if (this.props.closeConfirmStatus) {
      this.closeConfirm();
      return false;
    }

    if (previousProps.docs.length < docs.length) {
      this.activateTab(docs.length - 1);
    }

    // doc changed and codemirror exists
    if (((previousState.docKey !== this.state.docKey) || (previousProps.docs.length !== docs.length)) && codemirror) {
      codemirror.refresh();
      this.markFontColor(codemirror);
    }

    const doc = this.getDoc();
    const previousDoc = this.getDoc(this.state.docKey, previousProps);

    if (previousDoc && doc && previousDoc.editChunk && (false === doc.editChunk)) {
      codemirror.refresh();
    }
    const searchBar = this.refs.searchBar;
    if (searchBar) {
      searchBar.cm = codemirror;
    }

    if (previousProps.direction !== this.props.direction) {
      const editor = this.getEditor();
      if (editor) {
        editor.refresh();
      }
    }
  }

  getDocIndexByUuid(uuid) {
    return this.props.docs.findIndex(doc => doc.uuid === uuid);
  }

  changeActiveDocWhenClosing(uuid) {
    // don't do anything for non-active doc
    if (uuid !== this.state.docKey) {
      return false;
    }
    const docs = this.props.docs;
    const index = this.getDocIndexByUuid(uuid);
    const nextIndex = index + 1;
    const previousIndex = index - 1;
    const nextDoc = docs[nextIndex];
    const previousDoc = docs[previousIndex];

    if (nextDoc) {
      this.activateTab(nextIndex);
    }
    else if (previousDoc) {
      this.activateTab(previousIndex);
    }
  }

  closeTab(key) {

    const doc = this.getDocByKey(key);

    if (doc && this.docChanged(doc)) {

      // close a tab that's not active
      if (doc.uuid !== this.state.docKey) {
        const index = this.getDocIndexByUuid(doc.uuid);
        this.activateTab(index);
      }

      this.refs.modalSaveConfirm.open({
        title: 'Oops',
        message: 'You have unsaved content ! Do you want to save it ?'
      });
      return false;
    }
    this.closeDoc(key);
  }

  saveAndClose = () => {
    this.save();
    this.closeDoc();
    this.refs.modalSaveConfirm.close();
  };

  discard = () => {
    this.closeDoc();
    this.refs.modalSaveConfirm.close();
  };

  closeDoc(key) {

    if (! key) {
      key = this.state.docKey;
    }
    this.changeActiveDocWhenClosing(key);
    this.props.closeDoc(key);
  }

  getDocByKey = key => find(this.props.docs, {uuid: key});

  docChanged(doc = this.getDoc()) {
    return doc.changed;
  }

  handleClose = (props, e) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    this.closeTab(props.eventKey);
  };

  rotateTabLeft = () => {
    const docs = this.props.docs;
    if (docs.length < 2) {
      return false;
    }
    const index = this.getDocIndexByUuid(this.state.docKey);
    const nextIndex = (index - 1) < 0 ? docs.length - 1 : index - 1;
    this.activateTab(nextIndex);
  };

  rotateTabRight = () => {
    const docs = this.props.docs;
    if (docs.length < 2) {
      return false;
    }
    const index = this.getDocIndexByUuid(this.state.docKey);
    const nextIndex = (index + 1) > docs.length - 1 ? 0 : index + 1;
    this.activateTab(nextIndex);
  };

  getDoc(key = this.state.docKey, props = this.props) {
    return props.docs.find(doc => doc.uuid === key);
  }

  findPageIndexByName(name) {
    return get(this.getDoc(), 'pages', [])
      .findIndex(page => page.name === name);
  }

  handleInputChange = pageIndex => {
    if (this.props.spellCheckOn) {
      this.removeSpellCheckOverlay();
      this.addSpellCheckOverlay();
    }
    this.props.setPageIndex(this.state.docKey, pageIndex);
  };

  getPageInputValue(page = this.getCurrentPage()) {
    return get(page, 'name', '');
  }

  getPageIndex(doc = this.getDoc()) {
    return get(doc, 'pageIndex', 0);
  }

  save = (doc = this.getDoc()) => {

    const self = this;

    if (self.isSaving) {
      return false;
    }

    if (doc) {

      self.isSaving = true;

      Api.send('save', doc)
        .then(() => {
          return self.props.save(doc.uuid);
        })
        .then(() => {
          self.isSaving = false;
        });
    }
  };

  saveAs = newDocName => {

    const self = this;
    const doc = self.getDoc();
    Api.send('save-as', {doc, newDocName})
      .then(res => {
        self.refs.modalSaveAs.close();
        self.closeDocByName(doc.name);
        self.props.receiveDoc(res.doc);
      })
      .catch(res => self.refs.toast.error(res.message));
  };

  closeDocByName = name => {
    const doc = find(this.props.docs, {name});
    if (doc) {
      this.closeDoc(doc.uuid);
    }
  };

  exportZip() {

    const self = this;
    const doc = self.getDoc();

    if (! doc) {
      self.refs.toast.error('Open a bamboo then try export again');
      return false;
    }

    Api.send('export-zip', {name: doc.name})
      .then(res => {
        self.refs.toast.success(res.message);
      })
      .catch(res => self.refs.toast.error(res.message));
  }

  exportFileWithPb() {

    const self = this;
    const doc = self.getDoc();

    if (! doc) {
      self.refs.toast.error('Open a bamboo then try export again');
      return false;
    }

    Api.send('export-file-with-pb', {name: doc.name})
      .then(res => {
        self.refs.toast.success(res.message);
      })
      .catch(res => self.refs.toast.error(res.message));
  }

  cancel = () => {
    const searchBar = this.refs.searchBar;
    if (searchBar) {
      searchBar.close();
    }
  };

  splitPage = () => {

    const doc = this.getDoc();
    const cm = this.getCurrentCodemirror();

    if (isEmpty(cm)) {
      return false;
    }

    const {writePageContent, setPageIndex} = this.props;
    const cursor = cm.getCursor();
    const content = cm.getValue();
    const index = cm.indexFromPos(cursor);

    const firstPart = content.substring(0, index);
    let secondPart = content.substring(index, content.length);
    const pageIndex = doc.pageIndex;
    const pages = doc.pages;

    // https://github.com/karmapa/ketaka-lite/issues/53
    if (('\n' === secondPart[0]) && (secondPart.length > 1)) {
      secondPart = secondPart.substring(1);
    }

    if (pageIndex < (pages.length - 1)) {

      writePageContent(doc.uuid, pageIndex, firstPart);
      const nextPageIndex = pageIndex + 1;
      const nextPage = pages[nextPageIndex];
      const nextPageContent = secondPart + nextPage.content;

      writePageContent(doc.uuid, nextPageIndex, nextPageContent);
      setPageIndex(this.state.docKey, nextPageIndex);
    }
    else {
      this.refs.toast.error('You are on the last page');
    }
  };

  findNextQuery = (res, index) => {
    for (let i = 0, len = res.length; i < len; i++) {
      const query = res[i];
      if (index < query[0]) {
        return query;
      }
    }
    return null;
  };

  findPrevQuery = (res, index) => {
    for (let i = res.length - 1; i >= 0; i--) {
      const query = res[i];
      if (index > query[0]) {
        return query;
      }
    }
    return null;
  };

  replacePageContent = (query, text) => {

    query = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

    const regexp = new RegExp(query, 'g');
    const {writePageContent} = this.props;
    const doc = this.getDoc();
    const pages = doc.pages;
    let replaceCount = 0;
    const replaceFunc = () => {
      ++replaceCount;
      return text;
    };

    let pageIndex = doc.pageIndex;
    let page = pages[pageIndex];

    while (page) {
      const content = page.content.replace(regexp, replaceFunc);
      writePageContent(doc.uuid, pageIndex, content);
      page = pages[++pageIndex];
    }
    this.refs.toast.success(replaceCount + ' keywords have been replaced.');
    return replaceCount;
  };

  getMatchIndexByQuery = (query, index) => {

    query = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

    const page = this.getCurrentPage();
    const content = page.content.substring(0, index);
    return (content.match(new RegExp(query, 'g')) || []).length;
  };

  getIndexByMatchIndex = (query, index) => {
    query = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

    const content = get(this.getCurrentPage(), 'content', '');

    const re = new RegExp(query, 'g');
    let match = re.exec(content);
    let count = 0;

    while (match) {
      count++;
      if (count === index) {
        return match.index + query.length;
      }
      match = re.exec(content);
    }
    return null;
  };

  nextWord = () => {

    if (isEmpty(this.lastQueryRes)) {
      return false;
    }

    const cm = this.getCurrentCodemirror();

    if (! cm) {
      return false;
    }

    const cursor = cm.getCursor();
    const index = cm.indexFromPos(cursor);
    const query = this.findNextQuery(this.lastQueryRes, index);

    if (isNull(query)) {
      return false;
    }

    const from = query[0];
    const to = from + query[1];

    const fromPos = cm.posFromIndex(from);
    const toPos = cm.posFromIndex(to);

    cm.setSelection(fromPos, toPos);
  };

  prevWord = () => {

    if (isEmpty(this.lastQueryRes)) {
      return false;
    }

    const cm = this.getCurrentCodemirror();

    if (! cm) {
      return false;
    }

    const cursor = cm.getCursor();
    const selection = cm.getSelection();
    const index = cm.indexFromPos(cursor) - selection.length;
    const query = this.findPrevQuery(this.lastQueryRes, index);

    if (isNull(query)) {
      return false;
    }

    const from = query[0];
    const to = from + query[1];

    const fromPos = cm.posFromIndex(from);
    const toPos = cm.posFromIndex(to);

    cm.setSelection(fromPos, toPos);
  };

  runWithPage = fn => {
    const self = this;
    return () => {
      const page = self.getCurrentPage();
      if (page) {
        fn();
      }
    };
  };

  bindKeyboardEvents = () => {

    const self = this;

    if (self.keypressListener) {
      self.keypressListener.destroy();
    }

    const inputMethods = values(MAP_INPUT_METHODS);
    const invertedInputMethods = invert(MAP_INPUT_METHODS);

    self.keypressListener = new keypress.Listener();
    const keypressListener = Helper.camelize(['register_combo'], self.keypressListener);

    const shortcuts = clone(this.props.shortcuts);

    // format shortcuts data
    each(shortcuts, (shortcut, prop) => {
      shortcuts[prop] = shortcut.value.split(' + ').join(' ');
    });

    const simpleCombo = (keys, cb) => {
      return keypressListener.registerCombo({
        keys,
        'on_keyup': cb,
        'prevent_default': false,
        'is_exclusive': true,
        'is_unordered': true
      });
    };

    simpleCombo(shortcuts.undo, this.handleShortCutUndo);
    simpleCombo(shortcuts.redo, this.handleShortCutRedo);
    simpleCombo(shortcuts.addTab, this.addDoc);
    simpleCombo(shortcuts.closeTab, this.closeTab.bind(this, null));
    simpleCombo(shortcuts.prevTab, this.rotateTabLeft);
    simpleCombo(shortcuts.nextTab, this.rotateTabRight);
    simpleCombo(shortcuts.save, () => this.save());

    simpleCombo(shortcuts.splitPage, this.splitPage);
    simpleCombo(shortcuts.stop, this.cancel);

    simpleCombo(shortcuts.switchInputMethod, () => {

      const currentInputMethod = MAP_INPUT_METHODS[this.props.inputMethod];
      let index = inputMethods.indexOf(currentInputMethod);
      if (-1 === index) {
        index = 0;
      }
      ++index;
      if (index >= inputMethods.length) {
        index = 0;
      }
      const newMethod = inputMethods[index];
      this.props.setInputMethod(invertedInputMethods[newMethod]);
    });

    simpleCombo(shortcuts.find, self.runWithPage(self.refs.searchBar.find));
    simpleCombo(shortcuts.replace, self.runWithPage(self.refs.searchBar.replace));
    simpleCombo(shortcuts.stop, self.runWithPage(self.refs.searchBar.escape));

    simpleCombo(shortcuts.confirmReplace, () => {
      self.refs.searchBar.yes();
    });

    simpleCombo(shortcuts.confirmReject, () => {
      self.refs.searchBar.no();
    });

    simpleCombo(shortcuts.nextWord, this.nextWord);
    simpleCombo(shortcuts.prevWord, this.prevWord);
  };

  getModalEditDocs = () => this.refs.modalEditDocs.getWrappedInstance();

  handleAppEditDocs = () => this.getModalEditDocs().openModal();

  handleAppImport = () => this.import();

  handleAppImportZip = () => this.importZip();

  handleAppOpen = () => this.open();

  handleAppSave = () => this.save();

  handleAppSaveAs = async () => {

    const doc = this.getDoc();

    if (! doc) {
      return false;
    }

    const {docNames} = await Api.send('list-doc-name');

    this.refs.modalSaveAs.open({
      docName: doc.name,
      docNames
    });
  };

  handleAppSettings = () => {
    this.openSettingsModal();
    if (this.keypressListener) {
      this.keypressListener.destroy();
    }
  };

  handleAppExportZip = () => this.exportZip();

  handleAppExportFileWithPb = () => this.exportFileWithPb();

  handleImportStart = () => this.getImportModal().open();

  handleImportProgress = (event, res) => {

    const importModal = this.getImportModal();

    if (res.clean) {
      importModal.setMessages(res);
    }
    else {
      importModal.addMessages(res);
    }

    if (res.progress) {
      importModal.setProgress(res.progress);
    }
    importModal.setOptions({progressBarActive: true});
  };

  handleAppFind = () => this.refs.searchBar.find();

  handleAppUndo = () => {

    const editor = this.getEditor();

    if (editor && editor.hasFocus()) {
      this.undo();
    }
    else {
      Api.send('trigger-undo');
    }
  };

  handleAppRedo = () => {

    const editor = this.getEditor();

    if (editor && editor.hasFocus()) {
      this.redo();
    }
    else {
      Api.send('trigger-redo');
    }
  };

  handleAppSelectAll = () => {

    const cm = this.getCurrentCodemirror();

    if (cm && cm.hasFocus()) {
      CodeMirror.commands.selectAll(cm);
    }
    else {
      Api.send('trigger-selectall');
    }
  };

  handleAppSpellcheckExceptionList = () => this.getSpellCheckExceptionListModal().open();

  handleAppClose = () => {
    this.closeConfirm();
    this.props.setCloseConfirmStatus(true);
  };

  bindAppEvents = () => {

    eventHelper.on('app-import', this.handleAppImport);

    eventHelper.on('app-import-zip', this.handleAppImportZip);

    eventHelper.on('app-edit-docs', this.handleAppEditDocs);

    eventHelper.on('app-open', this.handleAppOpen);

    eventHelper.on('app-save', this.handleAppSave);

    eventHelper.on('app-save-as', this.handleAppSaveAs);

    eventHelper.on('app-settings', this.handleAppSettings);

    eventHelper.on('app-export-zip', this.handleAppExportZip);

    eventHelper.on('app-export-file-with-pb', this.handleAppExportFileWithPb);

    eventHelper.on('import-start', this.handleImportStart);

    eventHelper.on('import-progress', this.handleImportProgress);

    eventHelper.on('app-find', this.handleAppFind);

    eventHelper.on('app-undo', this.handleAppUndo);

    eventHelper.on('app-redo', this.handleAppRedo);

    eventHelper.on('app-select-all', this.handleAppSelectAll);

    eventHelper.on('app-replace', this.runWithPage(this.refs.searchBar.replace));

    eventHelper.on('app-spellcheck-exception-list', this.handleAppSpellcheckExceptionList);

    eventHelper.on('app-close', this.handleAppClose);
  };

  componentDidMount() {

    const self = this;

    Ime.setInputMethod(MAP_INPUT_METHODS[self.props.inputMethod]);

    this.bindKeyboardEvents();
    this.bindAppEvents();

    window.addEventListener('resize', this.handleResize);

    if (this.props.spellCheckOn) {
      this.addSpellCheckOverlay();
    }

    if (window.matchMedia) {
      const mediaQueryList = window.matchMedia('print');
      mediaQueryList.addListener(function(mql) {
        if (mql.matches) {
          // before print
        } else {
          // after print
          self.setState({
            print: false
          });
        }
      });
    }

  }

  handleResize = throttle(() => {
    this.forceUpdate();
  }, 300);

  handleFileCountWarning = paths => {

    const modalImport = this.getImportModal();

    modalImport.setMessages({
      type: 'warning',
      message: 'You are importing a large folder. Are you sure to import?'
    })
    .setOptions({
      progressBarStyle: 'warning',
      showFirstButton: true,
      firstButtonStyle: '',
      firstButtonText: 'Cancel',
      handleFirstButtonClick: () => modalImport.close(),
      showSecondButton: true,
      secondButtonStyle: 'warning',
      secondButtonText: 'Proceed',
      handleSecondButtonClick: handleSecondButtonClick.bind(this)
    });

    async function handleSecondButtonClick() {

      modalImport.setMessages([])
        .setOptions({
          progressBarStyle: 'info',
          showFirstButton: false,
          showSecondButton: false
        });

      try {
        const {doc, message} = await Api.send('import-button-clicked', {force: true, paths});

        this.props.importDoc(doc);
        this.refs.toast.success(message);

        modalImport.setOptions({
          showFirstButton: true,
          firstButtonStyle: 'primary',
          firstButtonText: 'OK'
        });
      }
      catch (err) {
        const {message} = err;
        this.refs.toast.error(message);
        modalImport.setMessages({
          type: 'danger',
          message
        })
        .setOptions({
          progressBarStyle: 'danger',
          progressBarActive: false,
          showFirstButton: true,
          handleFirstButtonClick: () => modalImport.close(),
          firstButtonStyle: 'danger',
          firstButtonText: 'I understand.'
        });
      }
    }
  };

  handleImportError = message => {

    const modalImport = this.getImportModal();
    this.refs.toast.error(message);

    modalImport.setMessages({
      type: 'danger',
      message
    })
    .setOptions({
      progressBarStyle: 'danger',
      progressBarActive: false,
      showFirstButton: true,
      handleFirstButtonClick: () => modalImport.close(),
      firstButtonStyle: 'danger',
      firstButtonText: 'I understand.'
    });
  };

  import = async () => {

    const modalImport = this.getImportModal();

    try {
      const {doc, message} = await Api.send('import-button-clicked');

      this.props.importDoc(doc);
      this.refs.toast.success(message);

      modalImport.setOptions({
        showFirstButton: true,
        firstButtonText: 'OK',
        firstButtonStyle: 'primary'
      });
    }
    catch (err) {

      const {type, paths, message} = err;

      if ('fileCountWarning' === type) {
        this.handleFileCountWarning(paths);
      }
      else {
        this.handleImportError(message);
      }
    }
  };

  importZip(args) {

    const self = this;
    const modalImport = self.getImportModal();

    Api.send('import-zip', args)
      .then(res => {
        self.props.importDoc(res.doc);
        self.refs.toast.success(res.message);
        modalImport.setOptions({
          showFirstButton: true,
          firstButtonStyle: 'primary',
          firstButtonText: 'OK',
          showSecondButton: false,
          handleFirstButtonClick: modalImport.close
        });
      })
      .catch(err => {
        if (err.duplicated) {
          this.handleDuplicatedImportZip(err);
        }
        else {
          self.refs.toast.error(err.message);
        }
      });
  }

  handleDuplicatedImportZip = ({paths, duplicatedDocName}) => {
    const modalImport = this.getImportModal();
    modalImport.setMessages({
      type: 'warning',
      message: 'Doc ' + duplicatedDocName + ' already exists. Are you sure you want to override ?'
    });
    modalImport.setOptions({
      showFirstButton: true,
      firstButtonStyle: '',
      firstButtonText: 'Cancel',
      handleFirstButtonClick: () => modalImport.close(),
      showSecondButton: true,
      secondButtonStyle: 'warning',
      secondButtonText: 'Override',
      handleSecondButtonClick: () => this.importZip({override: true, paths})
    });
  };

  open() {
    const self = this;

    Api.send('open')
      .then(res => {
        self.refs.modalOpen.open({
          names: res.names
        });
      });
  }

  getSettingsModal = () => this.refs.modalSettings.getWrappedInstance();

  getSpellCheckExceptionListModal = () => this.refs.modalSpellCheckExceptionList.getWrappedInstance();

  getImportModal = () => this.refs.modalImport.getWrappedInstance();

  openSettingsModal() {
    this.getSettingsModal().open();
  }

  componentWillUnmount() {
    eventHelper.off();
    this.keypressListener.destroy();
    window.removeEventListener('resize', this.handleResize);
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  getCurrentPage(doc = this.getDoc()) {
    if (! doc) {
      return null;
    }
    const pageIndex = this.getPageIndex(doc);
    return doc.pages[pageIndex];
  }

  handleLegacyPage = page => {
    if (! page.uuid) {
      page.uuid = 'page:' + uuid.v4();
    }
  };

  getActionByContents = (content1, content2) => {

    const diffRows = jsdiff.diffLines(content1, content2);

    let pos = 0;
    const action = [];

    each(diffRows, diffRow => {

      const diffRowValueLength = diffRow.value.length;

      if (diffRow.added) {
        action.push({
          added: true,
          value: diffRow.value,
          from: pos,
          to: pos + diffRowValueLength
        });
      }
      else if (diffRow.removed) {

        action.push({
          removed: true,
          value: diffRow.value,
          from: pos,
          to: pos + diffRowValueLength
        });
      }
      else {
        pos += diffRowValueLength;
      }
    });

    return action;
  };

  handleHistory = (cm, content) => {

    if (cm.disableHistory) {
      cm.disableHistory = false;
      return false;
    }

    const page = this.getCurrentPage();
    this.handleLegacyPage(page);

    const key = this.getHistoryKey();

    const action = this.getActionByContents(page.content, content);

    if (action.length > 0) {
      History.add(key, action);
    }
  };

  onCodemirrorChange = debounce((cm, content) => {

    const doc = this.getDoc();
    const page = this.getCurrentPage(doc);

    // switching pages
    if (page.content === content) {
      this.markFontColor(cm, page);
    }
    else {
      this.handleHistory(cm, content);
      this.props.writePageContent(doc.uuid, doc.pageIndex, content);
    }

    if (this.props.spellCheckOn) {
      this.lazyAddSpellCheckOverlay();
    }
  }, 300);

  lazyAddSpellCheckOverlay = throttle(this.addSpellCheckOverlay, 1000);

  getTabName = doc => {
    const tabName = doc.name;
    if (this.docChanged(doc)) {
      return tabName + '*';
    }
    return tabName;
  }

  onUploadButtonClick = () => {
    const self = this;
    const doc = this.getDoc();
    const {uuid, pageIndex} = doc;
    Api.send('page-image-upload-button-clicked', doc)
      .then(res => {
        self.props.updatePageImagePath(uuid, pageIndex, res.pathData);
        self.refs.toast.success(res.message);
      })
      .catch(res => self.refs.toast.error(res.message));
  }

  getImageSrc = (page, doc) => {
    const src = get(page, 'pathData.base');
    if (! src) {
      return '';
    }
    if (! src.match(/\.(bmp|gif|jpg|png)$/)) {
      return '';
    }
    return Path.resolve(this.docPath, doc.name, 'images', src);
  }

  handleSettingsButtonClick = () => {
    const self = this;

    Api.send('list-doc-name')
      .then(res => {
        const doc = self.getDoc();
        const page = self.getCurrentPage(doc);
        self.refs.modalDocSettings.open({
          docName: get(doc, 'name'),
          pageName: get(page, 'name'),
          docNames: res.docNames,
          pageNames: get(doc, 'pages', []).map(page => page.name)
        });
      });
  }

  saveAndCloseModalDocSettings = data => {
    const self = this;
    const doc = this.getDoc();
    const page = doc.pages[doc.pageIndex];
    data.doc = doc;

    if ((doc.name === data.docName) && (page.name === data.pageName)) {
      return this.refs.modalDocSettings.close();
    }

    Api.send('change-doc-settings', data)
      .then(res => {
        const doc = res.doc;
        self.props.receiveDoc(doc);
        self.refs.toast.success(res.message);
        self.refs.modalDocSettings.close();
      })
      .catch(res => self.refs.toast.error(res.message));
  }

  handlePageAddButtonClick = () => {
    this.refs.modalPageAdd.open({
      pageNames: get(this.getDoc(), 'pages', []).map(page => page.name)
    });
  }

  handlePageDeleteButtonClick = () => {
    this.refs.modalPageDeleteConfirm.open({
      title: 'Oops',
      message: 'Are you sure to delete this page ?'
    });
  }

  removeSpellCheckOverlay() {
    const lastOverlay = this.lastOverlay;
    if (lastOverlay) {
      const codemirror = this.getCurrentCodemirror();
      codemirror.removeOverlay(lastOverlay, false);
      this.lastOverlay = null;
    }
  }

  cancelSpellCheck() {
    this.removeSpellCheckOverlay();
    this.props.setSpellCheck(false);
  }

  addSpellCheckOverlay() {
    const codemirror = this.getCurrentCodemirror();

    if (! codemirror) {
      return false;
    }

    if (this.lastOverlay) {
      this.removeSpellCheckOverlay();
    }

    const content = codemirror.getValue();

    const res = checkSyllables(content);
    const {exceptionWords} = this.props;

    const queries = res.filter(row => {
      return ! exceptionWords.includes(row[2]);
    });

    this.lastQueryRes = queries;

    if (isEmpty(queries)) {
      return false;
    }

    const overlay = this.searchOverlay(queries, true);
    codemirror.addOverlay(overlay, {className: 'spellcheck'});

    this.lastOverlay = overlay;
  }

  checkSpelling() {

    const {spellCheckOn, toggleSpellCheck} = this.props;

    if (spellCheckOn) {
      this.removeSpellCheckOverlay();
    }
    else {
      this.addSpellCheckOverlay();
    }
    toggleSpellCheck();
  }

  searchOverlay(queries, caseInsensitive) {

    const tokens = map(queries, 2);
    const str = tokens.map(query => query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'))
      .join('|');

    const regexp = new RegExp(str, caseInsensitive ? 'gi' : 'g');

    return {
      token: function(stream) {

        regexp.lastIndex = stream.pos;

        const match = regexp.exec(stream.string);

        if (match && match.index === stream.pos) {
          const posArr = map(checkSyllables(stream.string), 0);
          const matchLine = posArr.includes(stream.pos);
          stream.pos += match[0].length;
          return matchLine ? 'typo' : null;
        }
        else if (match) {
          stream.pos = match.index;
        }
        else {
          stream.skipToEnd();
        }
      }
    };
  }

  handleColorButtonClick = color => {
    const doc = this.getDoc();
    const codemirror = this.getCurrentCodemirror();
    const hexColor = MAP_COLORS[color];
    const fontRecords = [];

    codemirror.listSelections()
      .forEach(selection => {
        const [from, to] = Helper.handleReverseSelection(selection.anchor, selection.head);
        const css = {css: 'color: ' + hexColor};
        codemirror.markText(from, to, css);
        fontRecords.push({from, to, css});
      });

    this.props.saveFontRecord(doc.uuid, doc.pageIndex, fontRecords);
  }

  handleSpellCheckButtonClick = () => {
    this.checkSpelling();
  }

  getEditorKey(uuid) {
    return uuid + '.editor';
  }

  getImageZoomerKey(uuid) {
    return uuid + '.image-zoomer';
  }

  closeModalPageAdd = () => {
    this.refs.modalPageAdd.close();
  }

  addPageAndCloseModal = pageName => {
    const doc = this.getDoc();
    this.props.addPage(doc.uuid, pageName);
    const pageIndex = findIndex(doc.pages, {name: pageName});
    this.props.setPageIndex(this.state.docKey, pageIndex);
    this.refs.modalPageAdd.close();
  }

  getImageZoomerHeight = () => {

    const {nsRatio, showImageOnly, showTextOnly} = this.props;
    let deltaRatio = showImageOnly ? 1 : nsRatio;

    if (showTextOnly) {
      deltaRatio = 0;
    }
    return (window.innerHeight - NON_EDITOR_AREA_HEIGHT - (RESIZER_SIZE / 2)) * deltaRatio;
  }

  getImageZoomerWidth = () => {

    const {ewRatio, showImageOnly, showTextOnly} = this.props;
    let deltaRatio = showImageOnly ? 1 : ewRatio;

    if (showTextOnly) {
      deltaRatio = 0;
    }
    return (window.innerWidth - (RESIZER_SIZE / 2)) * deltaRatio;
  }

  getEditorHeight() {

    const {direction, nsRatio, showTextOnly, showImageOnly} = this.props;
    let deltaRatio = showTextOnly ? 0 : nsRatio;

    if (DIRECTION_VERTICAL === direction) {
      return window.innerHeight - NON_EDITOR_AREA_HEIGHT - 7;
    }

    if (showImageOnly) {
      deltaRatio = 1;
    }
    return (window.innerHeight - NON_EDITOR_AREA_HEIGHT - (RESIZER_SIZE / 2)) * (1 - deltaRatio);
  }

  getEditorWidth() {

    const {direction} = this.props;
    const {ewRatio, showTextOnly, showImageOnly} = this.props;

    if (DIRECTION_HORIZONTAL === direction) {
      return window.innerWidth;
    }

    let deltaRatio = showTextOnly ? 0 : ewRatio;

    if (showImageOnly) {
      deltaRatio = 1;
    }
    return (window.innerWidth - (RESIZER_SIZE / 2)) * (1 - deltaRatio);
  }

  renderImageArea(key, src) {

    const style = {};

    if (DIRECTION_HORIZONTAL === this.props.direction) {
      style.height = this.getImageZoomerHeight();
    }
    else {
      style.width = this.getImageZoomerWidth();
    }

    if (src) {
      return <ImageZoomer style={style} key={key} className="image-zoomer" direction={this.props.direction} src={src} />;
    }
    return <ImageUploader style={style} key={key} className="image-uploader" onUploadButtonClick={this.onUploadButtonClick} />;
  }

  getCurrentCodemirror() {
    const uuid = get(this.getDoc(), 'uuid');
    const editorKey = this.getEditorKey(uuid);
    const editor = this.refs[editorKey];
    if (editor) {
      return get(editor.getWrappedInstance(), 'codemirror');
    }
    return null;
  }

  cancelDeletePage = () => {
    this.refs.modalPageDeleteConfirm.close();
  }

  deleteCurrentPage = () => {
    const doc = this.getDoc();
    const currentPageIndex = doc.pageIndex;

    if (currentPageIndex === (doc.pages.length - 1)) {
      doc.pageIndex = currentPageIndex - 1;
      this.props.setPageIndex(currentPageIndex - 1);
    }
    this.props.deletePage(doc.uuid, currentPageIndex);
    this.refs.modalPageDeleteConfirm.close();
  }

  isCurrentDoc(doc) {
    return doc.uuid === this.state.docKey;
  }

  renderDoc = doc => {

    const pageIndex = this.getPageIndex(doc);
    const page = doc.pages[pageIndex];
    const src = this.getImageSrc(page, doc);
    const key = doc.uuid;
    const imageZoomerKey = this.getImageZoomerKey(key);

    if (this.isCurrentDoc(doc)) {

      return (
        <TabItem eventKey={key} tab={this.getTabName(doc)} key={key}>

          <Resizer />

          {this.renderImageArea(imageZoomerKey, src)}
          {this.renderEditorArea(doc, pageIndex)}
        </TabItem>
      );
    }
    return <TabItem eventKey={key} tab={this.getTabName(doc)} key={key} />;
  }

  handleAddPbFileButtonClick = () => {
    const self = this;
    Api.send('add-pb-files', {doc: self.getDoc()})
      .then(res => {
        self.props.importDoc(res.doc);
        self.refs.toast.success(res.message);
      })
      .catch(res => self.refs.toast.error(res.message));
  }

  onBambooDeleteClick = name => {
    const self = this;
    self.closeDocByName(name);
    Api.send('delete-doc', {name})
      .then(res => self.refs.modalOpen.setNames(res.names));
  }

  onBambooClick = name => {
    const self = this;
    const openedDoc = find(this.props.docs, {name});
    if (openedDoc) {

      // activate this doc if its already opened
      const index = findIndex(this.props.docs, {uuid: openedDoc.uuid});
      if (-1 !== index) {
        this.activateTab(index);
      }

      this.refs.modalOpen.close();
    }
    else {

      Api.send('open-bamboo', {name})
        .then(res => {
          self.props.receiveDoc(res.doc);
          self.refs.modalOpen.close();
        });
    }
  }

  renderEditorArea = (doc, pageIndex) => {

    const {editChunk} = doc;
    const page = doc.pages[pageIndex];

    const style = {
      width: this.getEditorWidth(),
      height: this.getEditorHeight()
    };

    const key = doc.uuid;
    const editorKey = this.getEditorKey(key);

    const editorProps = {
      style,
      className: classNames({'editor': true, 'hidden': editChunk}),
      code: page.content || '',
      ref: editorKey,
      key: editorKey,
      onCodemirrorChange: this.onCodemirrorChange
    };

    return (
      <Editor {...editorProps} />
    );
  }

  getHistoryKey = () => {

    const doc = this.getDoc();
    const page = this.getCurrentPage();

    if (doc && page) {
      return doc.uuid + ':' + page.uuid;
    }
    return null;
  };

  findPrevIndexByKeyword = keyword => {
    const doc = this.getDoc();
    let pageIndex = doc.pageIndex;
    let page = doc.pages[--pageIndex];

    while (page) {
      const content = get(page, 'content', '');
      if (content.includes(keyword)) {
        return pageIndex;
      }
      page = doc.pages[--pageIndex];
    }
    return null;
  }

  findNextIndexByKeyword = keyword => {
    const doc = this.getDoc();
    let pageIndex = doc.pageIndex;
    let page = doc.pages[++pageIndex];

    while (page) {
      const content = get(page, 'content', '');
      if (content.includes(keyword)) {
        return pageIndex;
      }
      page = doc.pages[++pageIndex];
    }
    return null;
  }

  toPrevPage = () => {
    const doc = this.getDoc();
    const prevPageIndex = doc.pageIndex - 1;
    if (prevPageIndex >= 0) {
      this.props.setPageIndex(doc.uuid, prevPageIndex);
      return true;
    }
    else {
      return false;
    }
  }

  getEditor(doc = this.getDoc()) {
    if (! doc) {
      return null;
    }
    const editorKey = this.getEditorKey(doc.uuid);
    const editor = this.refs[editorKey];

    if (editor) {
      return editor.getWrappedInstance();
    }
    return null;
  }

  redo = () => {
    const key = this.getHistoryKey();
    const cm = this.getCurrentCodemirror();
    History.redo(key, cm);
  };

  handleRedoButtonClick = () => this.redo();

  undo = () => {
    const key = this.getHistoryKey();
    const cm = this.getCurrentCodemirror();
    History.undo(key, cm);
  };

  handleUndoButtonClick = () => this.undo();

  handleShortCutUndo = () => {
    const editor = this.getEditor();
    if (! editor) {
      return false;
    }
    if (editor.hasFocus()) {
      this.undo();
    }
    else {
      editor.focus();
    }
  }

  handleShortCutRedo = () => {
    const editor = this.getEditor();
    if (! editor) {
      return false;
    }
    if (editor.hasFocus()) {
      this.redo();
    }
    else {
      editor.focus();
    }
  }

  handleImageOnlyButtonClick = () => {

    const {showImageOnly, showTextOnly} = this.props;

    if (showTextOnly) {
      this.props.setTextOnly(false);
    }
    this.props.setImageOnly(! showImageOnly);
  };

  handleTextOnlyButtonClick = () => {

    const {showImageOnly, showTextOnly} = this.props;

    if (showImageOnly) {
      this.props.setImageOnly(false);
    }
    this.props.setTextOnly(! showTextOnly);
  };

  cancelModalSave = () => {
    this.refs.modalSaveConfirm.close();
  };

  handlePrintButtonClick = () => {
    this.setState({
      print: true
    });
  };

  renderEditorToolbar() {

    if (isEmpty(this.props.docs)) {
      return false;
    }

    const doc = this.getDoc();

    const editorToolbarProps = {
      canShowPageDeleteButton: doc && (doc.pages.length > 1),
      className: 'editor-toolbar',
      onAddPbFileButtonClick: this.handleAddPbFileButtonClick,
      onColorButtonClick: this.handleColorButtonClick,
      onInputChange: this.handleInputChange,
      onPageAddButtonClick: this.handlePageAddButtonClick,
      onPageDeleteButtonClick: this.handlePageDeleteButtonClick,
      onRedoButtonClick: this.handleRedoButtonClick,
      onSettingsButtonClick: this.handleSettingsButtonClick,
      onSpellCheckButtonClick: this.handleSpellCheckButtonClick,
      onPrintButtonClick: this.handlePrintButtonClick,
      onUndoButtonClick: this.handleUndoButtonClick,
      onImageOnlyButtonClick: this.handleImageOnlyButtonClick,
      onTextOnlyButtonClick: this.handleTextOnlyButtonClick,
      pageIndex: doc ? doc.pageIndex : 0,
      pageNames: doc ? doc.pages.map(page => page.name) : []
    };
    return <EditorToolbar {...editorToolbarProps} />;
  }

  render() {

    const {print} = this.state;
    const {docs, direction, setPageIndex, inputMethod} = this.props;
    const doc = this.getDoc();

    const classes = {
      [this.props.className]: true,
      'vertical': (DIRECTION_VERTICAL === direction)
    };

    const searchBarProps = {
      inputMethod,
      findNextIndexByKeyword: this.findNextIndexByKeyword,
      findPrevIndexByKeyword: this.findPrevIndexByKeyword,
      findMatchCountByKeyword: this.findMatchCountByKeyword,
      setPageIndex,
      toPrevPage: this.toPrevPage,
      doc,
      replacePageContent: this.replacePageContent,
      getMatchIndexByQuery: this.getMatchIndexByQuery,
      getIndexByMatchIndex: this.getIndexByMatchIndex
    };

    if (print) {
      return (
        <div className={classNames(classes)}>
          <PrintArea doc={doc} />
        </div>
      );
    }
    else {

      return (
        <div className={classNames(classes)}>
          <SearchBar ref="searchBar" {...searchBarProps} />
          {this.renderEditorToolbar()}
          <TabBox className="tab-box" activeKey={this.state.docKey} onSelect={this.handleSelect} onClose={this.handleClose}>
            {docs.map(this.renderDoc)}
            <TabItem className="button-add" eventKey={KEY_ADD_DOC} noCloseButton tab="+" />
          </TabBox>
          <ModalSaveConfirm ref="modalSaveConfirm" confirm={this.saveAndClose} discard={this.discard} cancel={this.cancelModalSave} />

          <ModalSaveConfirm ref="modalCloseConfirm" confirm={this.saveAndCloseModalClose} discard={this.discardModalClose} cancel={this.cancelModalClose} />

          <ModalConfirm ref="modalPageDeleteConfirm" confirmText="Delete"
            confirm={this.deleteCurrentPage} cancelText="Cancel" cancel={this.cancelDeletePage} />
          <ModalDocSettings ref="modalDocSettings" confirm={this.saveAndCloseModalDocSettings} />
          <ModalPageAdd ref="modalPageAdd" cancel={this.closeModalPageAdd} confirm={this.addPageAndCloseModal} />
          <ModalSettings ref="modalSettings" close={this.closeModalSettings} />
          <ModalImport className="modal-import" ref="modalImport" />
          <ModalOpen ref="modalOpen" onBambooClick={this.onBambooClick} onBambooDeleteClick={this.onBambooDeleteClick} />

          <ModalEditDocs ref="modalEditDocs" />

          <ModalSaveAs ref="modalSaveAs" saveAs={this.saveAs} />
          <ModalSpellCheckExceptionList ref="modalSpellCheckExceptionList" />
          <ToastContainer ref="toast" toastMessageFactory={ToastMessageFactory} className="toast-top-right" />

          <div className="section language-section">
            <DropdownButton id="dropdown" title={inputMethod}>
              {this.renderMenuItem(inputMethod, [INPUT_METHOD_SYSTEM, INPUT_METHOD_TIBETAN_EWTS, INPUT_METHOD_TIBETAN_SAMBHOTA, INPUT_METHOD_TIBETAN_SAMBHOTA2])}
            </DropdownButton>
          </div>
        </div>
      );
    }
  }

  renderCheckMark(show) {

    const className = classNames({
      'glyphicon': show,
      'glyphicon-ok': show,
      'empty': (! show)
    });

    return <i className={className}></i>;
  }

  onMenuItemSelect = method => {
    this.props.setInputMethod(method);
    const cm = this.getCurrentCodemirror();
    if (cm) {
      cm.focus();
    }
  };

  renderMenuItem(currentMethod, methods) {

    return methods.map((method, index) => {

      const props = {
        eventKey: index,
        key: index,
        onSelect: this.onMenuItemSelect.bind(this, method)
      };
      const showCheckMark = (currentMethod === method);

      return (
        <MenuItem {...props}>{this.renderCheckMark(showCheckMark)}{method}</MenuItem>
      );
    });
  }

  closeConfirm = () => {

    const unsavedDoc = this.props.docs.find(doc => doc.changed);

    if (unsavedDoc) {
      return this.refs.modalCloseConfirm.open({
        title: 'Oops! ' + unsavedDoc.name + ' is not saved !',
        message: 'Do you want to save it ?'
      });
    }
    Api.send('close');
  };

  saveAndCloseModalClose = () => {
    const unsavedDoc = this.props.docs.find(doc => doc.changed);
    this.save(unsavedDoc);
    this.closeDoc(unsavedDoc.uuid);
    this.refs.modalCloseConfirm.close();
  };

  discardModalClose = () => {
    const unsavedDoc = this.props.docs.find(doc => doc.changed);
    this.closeDoc(unsavedDoc.uuid);
    this.refs.modalCloseConfirm.close();
  };

  cancelModalClose = () => {
    this.refs.modalCloseConfirm.close();
    this.props.setCloseConfirmStatus(false);
  };
}
