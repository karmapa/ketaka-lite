import React, {PropTypes} from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import keypress from 'keypress.js';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {DropdownButton, MenuItem} from 'react-bootstrap';
import {Editor, ImageZoomer, ImageUploader, TabBox, TabItem, ModalConfirm, ModalSaveConfirm,
  ModalDocSettings, ModalPageAdd, SearchBar, ModalSettings, ModalSaveAs,
  ModalImportStatus, ModalOpen, ModalSpellCheckExceptionList, EditorToolbar,
  Resizer, PrintArea} from '.';
import {Helper, Ime} from '../services/';
import CodeMirror from 'codemirror';

import {MAP_COLORS, MAP_INPUT_METHODS, DIRECTION_VERTICAL, DIRECTION_HORIZONTAL,
  NON_EDITOR_AREA_HEIGHT, RESIZER_SIZE, INPUT_METHOD_SYSTEM, INPUT_METHOD_TIBETAN_EWTS,
  INPUT_METHOD_TIBETAN_SAMBHOTA, INPUT_METHOD_TIBETAN_SAMBHOTA2} from '../constants/AppConstants';

import {ToastContainer, ToastMessage} from 'react-toastr';
import Api from '../services/Api';

import {checkSyllables} from 'check-tibetan';
import Path from 'path';

let ToastMessageFactory = React.createFactory(ToastMessage.animation);

const KEY_ADD_DOC = 'KEY_ADD_DOC';

export default class EditorArea extends React.Component {

  static PropTypes = {
    addDoc: PropTypes.func.isRequired,
    addPage: PropTypes.func.isRequired,
    closeDoc: PropTypes.func.isRequired,
    createDoc: PropTypes.func.isRequired,
    deletePage: PropTypes.func.isRequired,
    docs: PropTypes.array.isRequired,
    importDoc: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired,
    setExceptionWords: PropTypes.func.isRequired,
    setImageOnly: PropTypes.func.isRequired,
    setInputMethod: PropTypes.func.isRequired,
    setPageIndex: PropTypes.func.isRequired,
    setSpellCheck: PropTypes.func.isRequired,
    setTextOnly: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired,
    toggleReadonly: PropTypes.func.isRequired,
    toggleSpellCheck: PropTypes.func.isRequired,
    updatePageImagePath: PropTypes.func.isRequired,
    updateSettings: PropTypes.func.isRequired,
    writePageContent: PropTypes.func.isRequired
  };

  docPath = '';
  keypressListener = null;

  lastQueryRes = [];

  constructor(props, context) {
    super(props, context);

    let {docs} = this.props;

    this.state = {
      print: false,
      docKey: docs.length > 0 ? _.first(docs).uuid : null
    };
  }

  componentWillMount() {
    let self = this;
    Api.send('get-app-data')
     .then(res => {
      self.docPath = res.docPath;
    });
  }

  closeModalSettings = () => {
    this.refs.modalSettings.close();
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
      return;
    }

    let fontRecords = _.get(page, 'config.fontRecords', []);
    fontRecords.forEach(record => {
      let {from, to, css} = record;
      codemirror.markText(from, to, css);
    });
  }

  componentDidUpdate(previousProps, previousState) {
    let docs = this.props.docs;
    let codemirror = this.getCurrentCodemirror();
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
    let previousDirection = _.get(previousProps, 'settings.direction');
    let direction = _.get(this.props, 'settings.direction');
    if (previousDirection !== direction) {
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
      return;
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
    if (this.docChanged()) {
      this.refs.modalSaveConfirm.open({
        title: 'Oops',
        message: 'You have unsaved content ! Do you want to save it ?'
      });
      return;
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

  docChanged(doc = this.getDoc()) {
    return doc.changed;
  }

  handleClose = (props, e) => {
    e.nativeEvent.stopImmediatePropagation();
    this.closeTab(props.eventKey);
  };

  rotateTabLeft = () => {
    let docs = this.props.docs;
    if (docs.length < 2) {
      return;
    }
    let index = this.getDocIndexByUuid(this.state.docKey);
    let nextIndex = (index - 1) < 0 ? docs.length - 1 : index - 1;
    this.activateTab(nextIndex);
  };

  rotateTabRight = () => {
    let docs = this.props.docs;
    if (docs.length < 2) {
      return;
    }
    let index = this.getDocIndexByUuid(this.state.docKey);
    let nextIndex = (index + 1) > docs.length - 1 ? 0 : index + 1;
    this.activateTab(nextIndex);
  };

  getDoc(key = this.state.docKey, props = this.props) {
    return props.docs.find(doc => doc.uuid === key);
  }

  findPageIndexByName(name) {
    return _.get(this.getDoc(), 'pages', [])
      .findIndex(page => page.name === name);
  }

  onInputChange = pageIndex => {
    let {spellCheckOn} = this.props.settings;
    if (spellCheckOn) {
      this.removeSpellCheckOverlay();
      this.addSpellCheckOverlay();
    }
    this.props.setPageIndex(this.state.docKey, pageIndex);
  };

  getPageInputValue(page = this.getCurrentPage()) {
    return _.get(page, 'name', '');
  }

  getPageIndex(doc = this.getDoc()) {
    return _.get(doc, 'pageIndex', 0);
  }

  save = () => {
    let self = this;
    let doc = self.getDoc();

    if (doc) {
      Api.send('save', doc)
        .then(() => self.props.save(self.state.docKey));
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
    let doc = _.find(this.props.docs, {name});
    if (doc) {
      this.closeDoc(doc.uuid);
    }
  };

  exportZip() {

    let self = this;
    let doc = self.getDoc();

    if (! doc) {
      self.refs.toast.error('Open a bamboo then try export again');
      return;
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
      return;
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
    if (_.isEmpty(cm)) {
      return;
    }

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

      cm.setValue(firstPart);
      cursor = cm.getCursor();
      cm.setCursor({line: cm.lastLine()});

      let nextPageIndex = pageIndex + 1;

      let nextPage = pages[nextPageIndex];
      let nextPageContent = secondPart + nextPage.content;

      this.props.writePageContent(doc.uuid, nextPageIndex, nextPageContent);
      this.props.setPageIndex(this.state.docKey, nextPageIndex);
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

    let content = _.get(this.getCurrentPage(), 'content', '');

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

    if (_.isEmpty(this.lastQueryRes)) {
      return;
    }

    let cm = this.getCurrentCodemirror();

    if (! cm) {
      return;
    }

    let cursor = cm.getCursor();
    let index = cm.indexFromPos(cursor);
    let query = this.findNextQuery(this.lastQueryRes, index);

    if (_.isNull(query)) {
      return;
    }

    let from = query[0];
    let to = from + query[1];

    let fromPos = cm.posFromIndex(from);
    let toPos = cm.posFromIndex(to);

    cm.setSelection(fromPos, toPos);
  };

  prevWord = () => {

    if (_.isEmpty(this.lastQueryRes)) {
      return;
    }

    let cm = this.getCurrentCodemirror();

    if (! cm) {
      return;
    }

    let cursor = cm.getCursor();
    let selection = cm.getSelection();
    let index = cm.indexFromPos(cursor) - selection.length;
    let query = this.findPrevQuery(this.lastQueryRes, index);

    if (_.isNull(query)) {
      return;
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

    let self = this;

    if (self.keypressListener) {
      self.keypressListener.destroy();
    }

    let inputMethods = _.values(MAP_INPUT_METHODS);
    let invertedInputMethods = _.invert(MAP_INPUT_METHODS);

    self.keypressListener = new keypress.Listener();
    let keypressListener = Helper.camelize(['register_combo'], self.keypressListener);

    let shortcuts = _.clone(this.props.settings.shortcuts);

    // format shortcuts data
    _.each(shortcuts, (shortcut, prop) => {
      shortcuts[prop] = shortcut.value.split(' + ').join(' ');
    });

    let simpleCombo = (keys, cb) => {
      return keypressListener.registerCombo({
        keys,
        'on_keyup': cb,
        'prevent_default': false,
        'is_unordered': true
      });
    };

    simpleCombo(shortcuts.addTab, this.addDoc);
    simpleCombo(shortcuts.closeTab, this.closeTab.bind(this, null));
    simpleCombo(shortcuts.prevTab, this.rotateTabLeft);
    simpleCombo(shortcuts.nextTab, this.rotateTabRight);
    simpleCombo(shortcuts.save, this.save);

    simpleCombo(shortcuts.splitPage, this.splitPage);
    simpleCombo(shortcuts.stop, this.cancel);

    simpleCombo(shortcuts.switchInputMethod, () => {

      let currentInputMethod = MAP_INPUT_METHODS[this.props.settings.inputMethod];
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

  componentDidMount() {

    let self = this;

    Ime.setInputMethod(MAP_INPUT_METHODS[self.props.inputMethod]);

    this.bindKeyboardEvents();

    Api.on('app-import', function() {
      self.import();
    });

    Api.on('app-import-zip', function() {
      self.importZip();
    });

    Api.on('app-open', function() {
      self.open();
    });

    Api.on('app-save', function() {
      self.save();
    });

    Api.on('app-save-as', function() {

      let doc = self.getDoc();

      if (doc) {

        Api.send('find-doc-names')
          .then(res => {
            self.refs.modalSaveAs.open({
              docName: doc.name,
              docNames: res.docNames
            });
          });
      }
    });

    Api.on('app-settings', function() {
      self.openSettingsModal();
      if (self.keypressListener) {
        self.keypressListener.destroy();
      }
    });

    Api.on('app-export-zip', function() {
      self.exportZip();
    });

    Api.on('app-export-file-with-pb', function() {
      self.exportFileWithPb();
    });

    Api.on('import-start', function() {
      self.refs.modalImportStatus.open({
        title: 'Import Status'
      });
    });

    Api.on('import-progress', function(res) {
      self.refs.modalImportStatus.addMessage(res);
    });

    Api.on('app-find', () => {
      self.refs.searchBar.find();
    });

    Api.on('select-all', () => {
      let cm = self.getCurrentCodemirror();
      if (cm && cm.hasFocus()) {
        CodeMirror.commands.selectAll(cm);
      }
    });

    Api.on('app-replace', self.runWithPage(self.refs.searchBar.replace));

    Api.on('app-spellcheck-exception-list', () => {
      self.refs.modalSpellCheckExceptionList.open();
    });

    window.addEventListener('resize', this.handleResize);

    if (this.props.settings.spellCheckOn) {
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

  handleResize = _.throttle(() => {
    this.forceUpdate();
  }, 300);

  initHistory = () => {
    let cm = this.getCurrentCodemirror();
    if (cm) {
      cm.clearHistory();
    }
  }

  import() {
    let self = this;

    Api.send('import-button-clicked')
      .then(res => {
        self.props.importDoc(res.doc);
        self.initHistory();
        self.refs.toast.success(res.message);
      })
      .catch(res => {

        if ('fileCountWarning' === res.type) {
          self.refs.modalImportStatus.showPrompt({
            progressStyle: 'warning',
            promptMessage: 'You are importing a large folder. Are you sure to import?',
            confirm: () => {

              self.refs.modalImportStatus.hidePrompt();

              Api.send('import-button-clicked', {force: true, paths: res.paths})
                .then(res => {
                  self.props.importDoc(res.doc);
                  self.initHistory();
                  self.refs.toast.success(res.message);
                })
                .catch(res => {
                  self.refs.toast.error(res.message);
                });
            }
          });
        }
        else {
          self.refs.toast.error(res.message);
        }
      });
  }

  importZip() {
    let self = this;

    Api.send('import-zip')
      .then(res => {
        self.props.importDoc(res.doc);
        self.refs.toast.success(res.message);
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

  openSettingsModal() {
    this.refs.modalSettings.open();
  }

  componentWillUnmount() {
    this.keypressListener.distroy();
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

  onCodemirrorChange = (cm, content) => {

    let doc = this.getDoc();
    let {uuid, pageIndex} = doc;
    let page = this.getCurrentPage(doc);

    // switching pages
    if (page.content === content) {
      this.markFontColor(cm, page);
    }
    else {
      this.props.writePageContent(uuid, pageIndex, content);
    }
    if (this.props.settings.spellCheckOn) {
      this.lazyAddSpellCheckOverlay();
    }
  }

  lazyAddSpellCheckOverlay = _.throttle(this.addSpellCheckOverlay, 1000);

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
    let src = _.get(page, 'pathData.base');
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

    Api.send('find-doc-names')
      .then(res => {
        let doc = self.getDoc();
        let page = self.getCurrentPage(doc);
        self.refs.modalDocSettings.open({
          docName: _.get(doc, 'name'),
          pageName: _.get(page, 'name'),
          docNames: res.docNames,
          pageNames: _.get(doc, 'pages', []).map(page => page.name)
        });
      });
  }

  closeModalDocSettings = () => {
    this.refs.modalDocSettings.close();
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

  onPageAddButtonClick = () => {
    this.refs.modalPageAdd.open({
      pageNames: _.get(this.getDoc(), 'pages', []).map(page => page.name)
    });
  }

  onPageDeleteButtonClick = () => {
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
    let self = this;
    let codemirror = this.getCurrentCodemirror();

    if (! codemirror) {
      return;
    }

    if (this.lastOverlay) {
      this.removeSpellCheckOverlay();
    }

    let content = codemirror.getValue();

    let res = checkSyllables(content);
    let {exceptionWords} = self.props.settings;

    res = res.filter(row => {
      return ! exceptionWords.includes(row[2]);
    });

    let queries = res.map(result => result[2]);

    this.lastQueryRes = res;

    if (_.isEmpty(queries)) {
      return;
    }

    let overlay = this.searchOverlay(queries, true);
    codemirror.addOverlay(overlay, {className: 'spellcheck'});

    this.lastOverlay = overlay;
  }

  checkSpelling() {

    let {settings, toggleSpellCheck} = this.props;
    let {spellCheckOn} = settings;

    if (spellCheckOn) {
      this.removeSpellCheckOverlay();
    }
    else {
      this.addSpellCheckOverlay();
    }
    toggleSpellCheck();
  }

  searchOverlay(queries, caseInsensitive) {

    let str = queries.map(query => query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'))
      .join('|');

    let regexp = new RegExp(str, caseInsensitive ? 'gi' : 'g');

    return {
      token: function(stream) {

        regexp.lastIndex = stream.pos;

        let match = regexp.exec(stream.string);

        if (match && match.index === stream.pos) {
          stream.pos += match[0].length;
          return 'typo';
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

  onColorButtonClick = color => {
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

  onSpellCheckButtonClick = () => {
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
    let pageIndex = _.findIndex(doc.pages, {name: pageName});
    this.props.setPageIndex(this.state.docKey, pageIndex);
    this.refs.modalPageAdd.close();
  }

  getImageZoomerHeight = () => {

    let {nsRatio, showImageOnly, showTextOnly} = this.props.settings;
    let deltaRatio = showImageOnly ? 1 : nsRatio;

    if (showTextOnly) {
      deltaRatio = 0;
    }
    return (window.innerHeight - NON_EDITOR_AREA_HEIGHT - (RESIZER_SIZE / 2)) * deltaRatio;
  }

  getImageZoomerWidth = () => {

    let {ewRatio, showImageOnly, showTextOnly} = this.props.settings;
    let deltaRatio = showImageOnly ? 1 : ewRatio;

    if (showTextOnly) {
      deltaRatio = 0;
    }
    return (window.innerWidth - (RESIZER_SIZE / 2)) * deltaRatio;
  }

  getEditorHeight() {

    let {nsRatio, showTextOnly, showImageOnly, direction} = this.props.settings;
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

    let {ewRatio, showTextOnly, showImageOnly, direction} = this.props.settings;

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

    if (DIRECTION_HORIZONTAL === this.props.settings.direction) {
      style.height = this.getImageZoomerHeight();
    }
    else {
      style.width = this.getImageZoomerWidth();
    }

    if (src) {
      return <ImageZoomer style={style} key={key} className="image-zoomer" direction={this.props.settings.direction} src={src} />;
    }
    return <ImageUploader style={style} key={key} className="image-uploader" onUploadButtonClick={this.onUploadButtonClick} />;
  }

  getCurrentCodemirror() {
    let uuid = _.get(this.getDoc(), 'uuid');
    let editorKey = this.getEditorKey(uuid);
    return _.get(this.refs[editorKey], 'codemirror');
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

  onAddPbFileButtonClick = () => {
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
    let openedDoc = _.find(this.props.docs, {name});
    if (openedDoc) {

      // activate this doc if its already opened
      let index = _.findIndex(this.props.docs, {uuid: openedDoc.uuid});
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

    let {settings} = this.props;

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
      onCodemirrorChange: this.onCodemirrorChange,
      settings
    };

    return (
      <Editor {...editorProps} />
    );
  }

  findPrevIndexByKeyword = keyword => {
    let doc = this.getDoc();
    let pageIndex = doc.pageIndex;
    let page = doc.pages[--pageIndex];

    while (page) {
      let content = _.get(page, 'content', '');
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
      let content = _.get(page, 'content', '');
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
    return this.refs[editorKey];
  }

  onRedoButtonClick = () => {
    let editor = this.getEditor();
    if (editor) {
      return editor.redo();
    }
  }

  onUndoButtonClick = () => {
    let editor = this.getEditor();
    if (editor) {
      return editor.undo();
    }
  }

  onImageOnlyButtonClick = () => {
    let settings = this.props.settings;
    let {showImageOnly, showTextOnly} = settings;

    if (showTextOnly) {
      this.props.setTextOnly(false);
    }
    this.props.setImageOnly(! showImageOnly);
  }

  onTextOnlyButtonClick = () => {
    let settings = this.props.settings;
    let {showImageOnly, showTextOnly} = settings;

    if (showImageOnly) {
      this.props.setImageOnly(false);
    }
    this.props.setTextOnly(! showTextOnly);
  }

  cancelModalSave = () => {
    this.refs.modalSaveConfirm.close();
  };

  onPrintButtonClick = () => {
    this.setState({
      print: true
    });
  };

  renderEditorToolbar() {

    if (_.isEmpty(this.props.docs)) {
      return false;
    }

    let doc = this.getDoc();

    let editorToolbarProps = {
      canShowPageDeleteButton: doc && (doc.pages.length > 1),
      className: 'editor-toolbar',
      onAddPbFileButtonClick: this.onAddPbFileButtonClick,
      onColorButtonClick: this.onColorButtonClick,
      onInputChange: this.onInputChange,
      onPageAddButtonClick: this.onPageAddButtonClick,
      onPageDeleteButtonClick: this.onPageDeleteButtonClick,
      onRedoButtonClick: this.onRedoButtonClick,
      onSettingsButtonClick: this.onSettingsButtonClick,
      onSpellCheckButtonClick: this.onSpellCheckButtonClick,
      onPrintButtonClick: this.onPrintButtonClick,
      onUndoButtonClick: this.onUndoButtonClick,
      onImageOnlyButtonClick: this.onImageOnlyButtonClick,
      onTextOnlyButtonClick: this.onTextOnlyButtonClick,
      pageIndex: doc ? doc.pageIndex : 0,
      pageNames: doc ? doc.pages.map(page => page.name) : []
    };
    return <EditorToolbar {...editorToolbarProps} />;
  }

  render() {

    let {print} = this.state;
    let {docs, settings, updateSettings, setExceptionWords, setPageIndex} = this.props;
    let inputMethod = settings.inputMethod;
    let doc = this.getDoc();

    let classes = {
      [this.props.className]: true,
      'vertical': DIRECTION_VERTICAL === settings.direction
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
          <ModalConfirm ref="modalPageDeleteConfirm" confirmText="Delete"
            confirm={this.deleteCurrentPage} cancelText="Cancel" cancel={this.cancelDeletePage} />
          <ModalDocSettings ref="modalDocSettings" cancel={this.closeModalDocSettings} confirm={this.saveAndCloseModalDocSettings} />
          <ModalPageAdd ref="modalPageAdd" cancel={this.closeModalPageAdd} confirm={this.addPageAndCloseModal} />
          <ModalSettings ref="modalSettings" settings={settings} updateSettings={updateSettings} close={this.closeModalSettings} />
          <ModalImportStatus className="modal-import-status" ref="modalImportStatus" />
          <ModalOpen ref="modalOpen" onBambooClick={this.onBambooClick} onBambooDeleteClick={this.onBambooDeleteClick} />
          <ModalSaveAs ref="modalSaveAs" saveAs={this.saveAs} />
          <ModalSpellCheckExceptionList ref="modalSpellCheckExceptionList" words={settings.exceptionWords}
            setExceptionWords={setExceptionWords} settings={settings} />
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

}
