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
    let doc = this.getDoc();
    let pages = doc.pages;
    let page = pages[doc.pageIndex];
    let content = page.content.substring(index);

    keyword = keyword.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    let regexp = new RegExp(keyword, 'g');
    let match = content.match(regexp);
    let count = match ? match.length : 0;

    let pageIndex = doc.pageIndex;
    let nextPage = pages[++pageIndex];

    while (nextPage) {
      let content = nextPage.content;
      let match = content.match(regexp);
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
    let activeDoc = this.props.docs[index];

    this.setState({
      docKey: activeDoc ? activeDoc.uuid : null
    });
  }

  addDoc = () => {
    this.props.createDoc();
  };

  markFontColor(codemirror = this.getCurrentCodemirror(), page = this.getCurrentPage()) {

    if (! codemirror) {
      return false;
    }

    let fontRecords = get(page, 'config.fontRecords', []);
    fontRecords.forEach(record => {
      let {from, to, css} = record;
      codemirror.markText(from, to, css);
    });
  }

  componentDidUpdate(previousProps, previousState) {

    let docs = this.props.docs;
    let codemirror = this.getCurrentCodemirror();

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

    let doc = this.getDoc();
    let previousDoc = this.getDoc(this.state.docKey, previousProps);

    if (previousDoc && doc && previousDoc.editChunk && (false === doc.editChunk)) {
      codemirror.refresh();
    }
    let searchBar = this.refs.searchBar;
    if (searchBar) {
      searchBar.cm = codemirror;
    }

    if (previousProps.direction !== this.props.direction) {
      let editor = this.getEditor();
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
    let docs = this.props.docs;
    let index = this.getDocIndexByUuid(uuid);
    let nextIndex = index + 1;
    let previousIndex = index - 1;
    let nextDoc = docs[nextIndex];
    let previousDoc = docs[previousIndex];

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
    let docs = this.props.docs;
    if (docs.length < 2) {
      return false;
    }
    let index = this.getDocIndexByUuid(this.state.docKey);
    let nextIndex = (index - 1) < 0 ? docs.length - 1 : index - 1;
    this.activateTab(nextIndex);
  };

  rotateTabRight = () => {
    let docs = this.props.docs;
    if (docs.length < 2) {
      return false;
    }
    let index = this.getDocIndexByUuid(this.state.docKey);
    let nextIndex = (index + 1) > docs.length - 1 ? 0 : index + 1;
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

    let self = this;

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

    let self = this;
    let doc = self.getDoc();
    Api.send('save-as', {doc, newDocName})
      .then(res => {
        self.refs.modalSaveAs.close();
        self.closeDocByName(doc.name);
        self.props.receiveDoc(res.doc);
      })
      .catch(res => self.refs.toast.error(res.message));
  };

  closeDocByName = name => {
    let doc = find(this.props.docs, {name});
    if (doc) {
      this.closeDoc(doc.uuid);
    }
  };

  exportZip() {

    let self = this;
    let doc = self.getDoc();

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

    let self = this;
    let doc = self.getDoc();

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
    let searchBar = this.refs.searchBar;
    if (searchBar) {
      searchBar.close();
    }
  };

  splitPage = () => {

    let doc = this.getDoc();
    let cm = this.getCurrentCodemirror();

    if (isEmpty(cm)) {
      return false;
    }

    let {writePageContent, setPageIndex} = this.props;
    let cursor = cm.getCursor();
    let content = cm.getValue();
    let index = cm.indexFromPos(cursor);

    let firstPart = content.substring(0, index);
    let secondPart = content.substring(index, content.length);
    let pageIndex = doc.pageIndex;
    let pages = doc.pages;

    // https://github.com/karmapa/ketaka-lite/issues/53
    if (('\n' === secondPart[0]) && (secondPart.length > 1)) {
      secondPart = secondPart.substring(1);
    }

    if (pageIndex < (pages.length - 1)) {

      writePageContent(doc.uuid, pageIndex, firstPart);
      let nextPageIndex = pageIndex + 1;
      let nextPage = pages[nextPageIndex];
      let nextPageContent = secondPart + nextPage.content;

      writePageContent(doc.uuid, nextPageIndex, nextPageContent);
      setPageIndex(this.state.docKey, nextPageIndex);
    }
    else {
      this.refs.toast.error('You are on the last page');
    }
  }

  findNextQuery = (res, index) => {
    for (let i = 0, len = res.length; i < len; i++) {
      let query = res[i];
      if (index < query[0]) {
        return query;
      }
    }
    return null;
  }

  findPrevQuery = (res, index) => {
    for (let i = res.length - 1; i >= 0; i--) {
      let query = res[i];
      if (index > query[0]) {
        return query;
      }
    }
    return null;
  }

  replacePageContent = (query, text) => {

    query = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

    let regexp = new RegExp(query, 'g');
    let {writePageContent} = this.props;
    let doc = this.getDoc();
    let pages = doc.pages;
    let replaceCount = 0;
    let replaceFunc = () => {
      ++replaceCount;
      return text;
    };

    let pageIndex = doc.pageIndex;
    let page = pages[pageIndex];

    while (page) {
      let content = page.content.replace(regexp, replaceFunc);
      writePageContent(doc.uuid, pageIndex, content);
      page = pages[++pageIndex];
    }
    this.refs.toast.success(replaceCount + ' keywords have been replaced.');
    return replaceCount;
  }

  getMatchIndexByQuery = (query, index) => {

    query = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

    let page = this.getCurrentPage();
    let content = page.content.substring(0, index);
    return (content.match(new RegExp(query, 'g')) || []).length;
  }

  getIndexByMatchIndex = (query, index) => {
    query = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

    let content = get(this.getCurrentPage(), 'content', '');

    let re = new RegExp(query, 'g');
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
  }

  nextWord = () => {

    if (isEmpty(this.lastQueryRes)) {
      return false;
    }

    let cm = this.getCurrentCodemirror();

    if (! cm) {
      return false;
    }

    let cursor = cm.getCursor();
    let index = cm.indexFromPos(cursor);
    let query = this.findNextQuery(this.lastQueryRes, index);

    if (isNull(query)) {
      return false;
    }

    let from = query[0];
    let to = from + query[1];

    let fromPos = cm.posFromIndex(from);
    let toPos = cm.posFromIndex(to);

    cm.setSelection(fromPos, toPos);
  };

  prevWord = () => {

    if (isEmpty(this.lastQueryRes)) {
      return false;
    }

    let cm = this.getCurrentCodemirror();

    if (! cm) {
      return false;
    }

    let cursor = cm.getCursor();
    let selection = cm.getSelection();
    let index = cm.indexFromPos(cursor) - selection.length;
    let query = this.findPrevQuery(this.lastQueryRes, index);

    if (isNull(query)) {
      return false;
    }

    let from = query[0];
    let to = from + query[1];

    let fromPos = cm.posFromIndex(from);
    let toPos = cm.posFromIndex(to);

    cm.setSelection(fromPos, toPos);
  };

  runWithPage = (fn) => {
    let self = this;
    return () => {
      let page = self.getCurrentPage();
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

    let inputMethods = values(MAP_INPUT_METHODS);
    let invertedInputMethods = invert(MAP_INPUT_METHODS);

    self.keypressListener = new keypress.Listener();
    let keypressListener = Helper.camelize(['register_combo'], self.keypressListener);

    let shortcuts = clone(this.props.shortcuts);

    // format shortcuts data
    each(shortcuts, (shortcut, prop) => {
      shortcuts[prop] = shortcut.value.split(' + ').join(' ');
    });

    let simpleCombo = (keys, cb) => {
      return keypressListener.registerCombo({
        keys,
        'on_keyup': cb,
        'prevent_default': false,
        'is_exclusive': true,
        'is_unordered': true
      });
    };

    simpleCombo(shortcuts.addTab, this.addDoc);
    simpleCombo(shortcuts.closeTab, this.closeTab.bind(this, null));
    simpleCombo(shortcuts.prevTab, this.rotateTabLeft);
    simpleCombo(shortcuts.nextTab, this.rotateTabRight);
    simpleCombo(shortcuts.save, () => this.save());

    simpleCombo(shortcuts.splitPage, this.splitPage);
    simpleCombo(shortcuts.stop, this.cancel);

    simpleCombo(shortcuts.switchInputMethod, () => {

      let currentInputMethod = MAP_INPUT_METHODS[this.props.inputMethod];
      let index = inputMethods.indexOf(currentInputMethod);
      if (-1 === index) {
        index = 0;
      }
      ++index;
      if (index >= inputMethods.length) {
        index = 0;
      }
      let newMethod = inputMethods[index];
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

    let self = this;

    Ime.setInputMethod(MAP_INPUT_METHODS[self.props.inputMethod]);

    this.bindKeyboardEvents();
    this.bindAppEvents();

    window.addEventListener('resize', this.handleResize);

    if (this.props.spellCheckOn) {
      this.addSpellCheckOverlay();
    }

    if (window.matchMedia) {
      let mediaQueryList = window.matchMedia('print');
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

  importZip() {

    const self = this;
    const modalImport = self.getImportModal();

    Api.send('import-zip')
      .then(res => {
        self.props.importDoc(res.doc);
        self.refs.toast.success(res.message);
        modalImport.setOptions({
          showFirstButton: true,
          firstButtonStyle: 'primary',
          firstButtonText: 'OK',
          handleFirstButtonClick: modalImport.close
        });
      })
      .catch(res => {
        console.error(res.message);
        self.refs.toast.error(res.message);
      });
  }

  open() {
    let self = this;

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
    let pageIndex = this.getPageIndex(doc);
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
    let action = [];

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

    let doc = this.getDoc();
    let page = this.getCurrentPage(doc);

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
    let tabName = doc.name;
    if (this.docChanged(doc)) {
      return tabName + '*';
    }
    return tabName;
  }

  onUploadButtonClick = () => {
    let self = this;
    let doc = this.getDoc();
    let {uuid, pageIndex} = doc;
    Api.send('page-image-upload-button-clicked', doc)
      .then(res => {
        self.props.updatePageImagePath(uuid, pageIndex, res.pathData);
        self.refs.toast.success(res.message);
      })
      .catch(res => self.refs.toast.error(res.message));
  }

  getImageSrc = (page, doc) => {
    let src = get(page, 'pathData.base');
    if (! src) {
      return '';
    }
    if (! src.match(/\.(bmp|gif|jpg|png)$/)) {
      return '';
    }
    return Path.resolve(this.docPath, doc.name, 'images', src);
  }

  onSettingsButtonClick = () => {
    let self = this;

    Api.send('list-doc-name')
      .then(res => {
        let doc = self.getDoc();
        let page = self.getCurrentPage(doc);
        self.refs.modalDocSettings.open({
          docName: get(doc, 'name'),
          pageName: get(page, 'name'),
          docNames: res.docNames,
          pageNames: get(doc, 'pages', []).map(page => page.name)
        });
      });
  }

  saveAndCloseModalDocSettings = data => {
    let self = this;
    let doc = this.getDoc();
    let page = doc.pages[doc.pageIndex];
    data.doc = doc;

    if ((doc.name === data.docName) && (page.name === data.pageName)) {
      return this.refs.modalDocSettings.close();
    }

    Api.send('change-doc-settings', data)
      .then(res => {
        let doc = res.doc;
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
    let lastOverlay = this.lastOverlay;
    if (lastOverlay) {
      let codemirror = this.getCurrentCodemirror();
      codemirror.removeOverlay(lastOverlay, false);
      this.lastOverlay = null;
    }
  }

  cancelSpellCheck() {
    this.removeSpellCheckOverlay();
    this.props.setSpellCheck(false);
  }

  addSpellCheckOverlay() {
    let codemirror = this.getCurrentCodemirror();

    if (! codemirror) {
      return false;
    }

    if (this.lastOverlay) {
      this.removeSpellCheckOverlay();
    }

    let content = codemirror.getValue();

    let res = checkSyllables(content);
    let {exceptionWords} = this.props;

    let queries = res.filter(row => {
      return ! exceptionWords.includes(row[2]);
    });

    this.lastQueryRes = queries;

    if (isEmpty(queries)) {
      return false;
    }

    let overlay = this.searchOverlay(queries, true);
    codemirror.addOverlay(overlay, {className: 'spellcheck'});

    this.lastOverlay = overlay;
  }

  checkSpelling() {

    let {spellCheckOn, toggleSpellCheck} = this.props;

    if (spellCheckOn) {
      this.removeSpellCheckOverlay();
    }
    else {
      this.addSpellCheckOverlay();
    }
    toggleSpellCheck();
  }

  searchOverlay(queries, caseInsensitive) {

    let tokens = map(queries, 2);
    let str = tokens.map(query => query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'))
      .join('|');

    let regexp = new RegExp(str, caseInsensitive ? 'gi' : 'g');

    return {
      token: function(stream) {

        regexp.lastIndex = stream.pos;

        let match = regexp.exec(stream.string);

        if (match && match.index === stream.pos) {
          let posArr = map(checkSyllables(stream.string), 0);
          let matchLine = posArr.includes(stream.pos);
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
    let doc = this.getDoc();
    let codemirror = this.getCurrentCodemirror();
    let hexColor = MAP_COLORS[color];
    let fontRecords = [];

    codemirror.listSelections()
      .forEach(selection => {
        let [from, to] = Helper.handleReverseSelection(selection.anchor, selection.head);
        let css = {css: 'color: ' + hexColor};
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
    let doc = this.getDoc();
    this.props.addPage(doc.uuid, pageName);
    let pageIndex = findIndex(doc.pages, {name: pageName});
    this.props.setPageIndex(this.state.docKey, pageIndex);
    this.refs.modalPageAdd.close();
  }

  getImageZoomerHeight = () => {

    let {nsRatio, showImageOnly, showTextOnly} = this.props;
    let deltaRatio = showImageOnly ? 1 : nsRatio;

    if (showTextOnly) {
      deltaRatio = 0;
    }
    return (window.innerHeight - NON_EDITOR_AREA_HEIGHT - (RESIZER_SIZE / 2)) * deltaRatio;
  }

  getImageZoomerWidth = () => {

    let {ewRatio, showImageOnly, showTextOnly} = this.props;
    let deltaRatio = showImageOnly ? 1 : ewRatio;

    if (showTextOnly) {
      deltaRatio = 0;
    }
    return (window.innerWidth - (RESIZER_SIZE / 2)) * deltaRatio;
  }

  getEditorHeight() {

    let {direction, nsRatio, showTextOnly, showImageOnly} = this.props;
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

    let {direction} = this.props;
    let {ewRatio, showTextOnly, showImageOnly} = this.props;

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

    let style = {};

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
    let uuid = get(this.getDoc(), 'uuid');
    let editorKey = this.getEditorKey(uuid);
    let editor = this.refs[editorKey];
    if (editor) {
      return get(editor.getWrappedInstance(), 'codemirror');
    }
    return null;
  }

  cancelDeletePage = () => {
    this.refs.modalPageDeleteConfirm.close();
  }

  deleteCurrentPage = () => {
    let doc = this.getDoc();
    let currentPageIndex = doc.pageIndex;

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

    let pageIndex = this.getPageIndex(doc);
    let page = doc.pages[pageIndex];
    let src = this.getImageSrc(page, doc);
    let key = doc.uuid;
    let imageZoomerKey = this.getImageZoomerKey(key);

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
    let self = this;
    Api.send('add-pb-files', {doc: self.getDoc()})
      .then(res => {
        self.props.importDoc(res.doc);
        self.refs.toast.success(res.message);
      })
      .catch(res => self.refs.toast.error(res.message));
  }

  onBambooDeleteClick = name => {
    let self = this;
    self.closeDocByName(name);
    Api.send('delete-doc', {name})
      .then(res => self.refs.modalOpen.setNames(res.names));
  }

  onBambooClick = name => {
    let self = this;
    let openedDoc = find(this.props.docs, {name});
    if (openedDoc) {

      // activate this doc if its already opened
      let index = findIndex(this.props.docs, {uuid: openedDoc.uuid});
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

    let {editChunk} = doc;
    let page = doc.pages[pageIndex];

    let style = {
      width: this.getEditorWidth(),
      height: this.getEditorHeight()
    };

    let key = doc.uuid;
    let editorKey = this.getEditorKey(key);

    let editorProps = {
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
    let doc = this.getDoc();
    let pageIndex = doc.pageIndex;
    let page = doc.pages[--pageIndex];

    while (page) {
      let content = get(page, 'content', '');
      if (content.includes(keyword)) {
        return pageIndex;
      }
      page = doc.pages[--pageIndex];
    }
    return null;
  }

  findNextIndexByKeyword = keyword => {
    let doc = this.getDoc();
    let pageIndex = doc.pageIndex;
    let page = doc.pages[++pageIndex];

    while (page) {
      let content = get(page, 'content', '');
      if (content.includes(keyword)) {
        return pageIndex;
      }
      page = doc.pages[++pageIndex];
    }
    return null;
  }

  toPrevPage = () => {
    let doc = this.getDoc();
    let prevPageIndex = doc.pageIndex - 1;
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
    let editorKey = this.getEditorKey(doc.uuid);
    let editor = this.refs[editorKey];

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

  handleImageOnlyButtonClick = () => {
    let {showImageOnly, showTextOnly} = this.props;

    if (showTextOnly) {
      this.props.setTextOnly(false);
    }
    this.props.setImageOnly(! showImageOnly);
  };

  onTextOnlyButtonClick = () => {
    let {showImageOnly, showTextOnly} = this.props;

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

    let doc = this.getDoc();

    let editorToolbarProps = {
      canShowPageDeleteButton: doc && (doc.pages.length > 1),
      className: 'editor-toolbar',
      onAddPbFileButtonClick: this.handleAddPbFileButtonClick,
      onColorButtonClick: this.handleColorButtonClick,
      onInputChange: this.handleInputChange,
      onPageAddButtonClick: this.handlePageAddButtonClick,
      onPageDeleteButtonClick: this.handlePageDeleteButtonClick,
      onRedoButtonClick: this.handleRedoButtonClick,
      onSettingsButtonClick: this.onSettingsButtonClick,
      onSpellCheckButtonClick: this.handleSpellCheckButtonClick,
      onPrintButtonClick: this.handlePrintButtonClick,
      onUndoButtonClick: this.handleUndoButtonClick,
      onImageOnlyButtonClick: this.handleImageOnlyButtonClick,
      onTextOnlyButtonClick: this.onTextOnlyButtonClick,
      pageIndex: doc ? doc.pageIndex : 0,
      pageNames: doc ? doc.pages.map(page => page.name) : []
    };
    return <EditorToolbar {...editorToolbarProps} />;
  }

  render() {

    let {print} = this.state;
    let {docs, direction, setPageIndex, inputMethod} = this.props;
    let doc = this.getDoc();

    let classes = {
      [this.props.className]: true,
      'vertical': (DIRECTION_VERTICAL === direction)
    };

    let searchBarProps = {
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

  renderCheckMark(render) {
    return render ? <i className="glyphicon glyphicon-ok"></i> : <i className="empty"></i>;
  }

  onMenuItemSelect = method => {
    this.props.setInputMethod(method);
    let cm = this.getCurrentCodemirror();
    if (cm) {
      cm.focus();
    }
  };

  renderMenuItem(currentMethod, methods) {
    return methods.map((method, index) => {
      return (
        <MenuItem eventKey={index} key={index} onSelect={this.onMenuItemSelect.bind(this, method)}>{this.renderCheckMark(currentMethod === method)}{method}</MenuItem>
      );
    });
  }

  closeConfirm = () => {
    let unsavedDoc = this.props.docs.find(doc => doc.changed);
    if (unsavedDoc) {
      this.refs.modalCloseConfirm.open({
        title: 'Oops! ' + unsavedDoc.name + ' is not saved !',
        message: 'Do you want to save it ?'
      });
    }
    else {
      Api.send('close');
    }
  };

  saveAndCloseModalClose = () => {
    let unsavedDoc = this.props.docs.find(doc => doc.changed);
    this.save(unsavedDoc);
    this.closeDoc(unsavedDoc.uuid);
    this.refs.modalCloseConfirm.close();
  };

  discardModalClose = () => {
    let unsavedDoc = this.props.docs.find(doc => doc.changed);
    this.closeDoc(unsavedDoc.uuid);
    this.refs.modalCloseConfirm.close();
  };

  cancelModalClose = () => {
    this.refs.modalCloseConfirm.close();
    this.props.setCloseConfirmStatus(false);
  };
}
