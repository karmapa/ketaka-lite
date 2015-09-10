import React, {PropTypes} from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import keypress from 'keypress.js';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Editor, ImageZoomer, ImageUploader, TabBox, TabItem, ModalConfirm,
  ModalDocSettings, ModalPageAdd, ChunkEditor} from '.';
import {DocHelper, Helper} from '../services/';

import {MAP_COLORS} from '../constants/AppConstants';

import ReactToastr from 'react-toastr';
import Ipc from '../services/Ipc';

import {checkSyllables} from 'check-tibetan';

let {ToastContainer} = ReactToastr;
let ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);

const KEY_ADD_DOC = 'KEY_ADD_DOC';

export default class EditorArea extends React.Component {

  static PropTypes = {
    settings: PropTypes.object.isRequired,
    addDoc: PropTypes.func.isRequired,
    createDoc: PropTypes.func.isRequired,
    addPage: PropTypes.func.isRequired,
    deletePage: PropTypes.func.isRequired,
    updatePageImagePath: PropTypes.func.isRequired,
    closeDoc: PropTypes.func.isRequired,
    docs: PropTypes.array.isRequired,
    inputMethod: PropTypes.string.isRequired,
    save: PropTypes.func.isRequired,
    setInputMethod: PropTypes.func.isRequired,
    setFontSize: PropTypes.func.isRequired,
    setLineHeight: PropTypes.func.isRequired,
    setLetterSpacing: PropTypes.func.isRequired,
    toggleReadonly: PropTypes.func.isRequired,
    writePageContent: PropTypes.func.isRequired
  };

  keypressListener = null;

  constructor(props, context) {
    super(props, context);

    let {docs} = this.props;

    this.state = {
      docKey: docs.length > 0 ? _.first(docs).uuid : null
    };
  }

  handleSelect(key) {
    if (KEY_ADD_DOC === key) {
      return this.addDoc();
    }
    if (key !== this.state.docKey) {
      this.setState({
        docKey: key
      });
    }
  }

  activateTab(index) {
    let activeDoc = this.props.docs[index];

    this.setState({
      pageInputValue: activeDoc.pages[activeDoc.pageIndex].name,
      docKey: activeDoc ? activeDoc.uuid : null
    });
  }

  addDoc() {
    this.props.createDoc();
  }

  markFontColor(codemirror = this.getCurrentCodemirror(), page = this.getCurrentPage()) {
    let fontRecords = _.get(page, 'config.fontRecords', []);
    fontRecords.forEach(record => {
      let {from, to, css} = record;
      codemirror.markText(from, to, css);
    });
  }

  componentDidUpdate(previousProps, previousState) {
    let docs = this.props.docs;
    if (previousProps.docs.length < docs.length) {
      this.activateTab(docs.length - 1);
    }
    if (previousState.docKey !== this.state.docKey) {
      let codemirror = this.getCurrentCodemirror();
      codemirror.refresh();
      this.markFontColor(codemirror);
    }

    let doc = this.getDoc();
    let previousDoc = this.getDoc(this.state.docKey, previousProps);

    if (previousDoc.editChunk && (false === doc.editChunk)) {
      let codemirror = this.getCurrentCodemirror();
      codemirror.refresh();
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

  saveAndClose() {
    this.save();
    this.closeDoc();
    this.refs.modalSaveConfirm.close();
  }

  discard() {
    this.closeDoc();
    this.refs.modalSaveConfirm.close();
  }

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

  handleClose(props, e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    this.closeTab(props.eventKey);
  }

  rotateTabLeft() {
    let docs = this.props.docs;
    if (docs.length < 2) {
      return;
    }
    let index = this.getDocIndexByUuid(this.state.docKey);
    let nextIndex = (index - 1) < 0 ? docs.length - 1 : index - 1;
    this.activateTab(nextIndex);
  }

  rotateTabRight() {
    let docs = this.props.docs;
    if (docs.length < 2) {
      return;
    }
    let index = this.getDocIndexByUuid(this.state.docKey);
    let nextIndex = (index + 1) > docs.length - 1 ? 0 : index + 1;
    this.activateTab(nextIndex);
  }

  getDoc(key = this.state.docKey, props = this.props) {
    return props.docs.find(doc => doc.uuid === key);
  }

  findPageIndexByName(name) {
    return _.get(this.getDoc(), 'pages', [])
      .findIndex(page => page.name === name);
  }

  onInputChange(pageIndex) {
    this.props.setPageIndex(this.state.docKey, pageIndex);
  }

  getPageInputValue(page = this.getCurrentPage()) {
    return _.get(page, 'name', '');
  }

  getPageIndex(doc = this.getDoc()) {
    return _.get(doc, 'pageIndex', 0);
  }

  save() {
    let self = this;
    Ipc.send('save', self.getDoc())
      .then(() => self.props.save(self.state.docKey));
  }

  onActivateTab(doc) {
    let index = _.findIndex(this.props.docs, {uuid: doc.uuid});
    if (-1 !== index) {
      this.activateTab(index);
    }
  }

  onCloseDoc(name) {
    let doc = _.find(this.props.docs, {name});
    if (doc) {
      this.closeDoc(doc.uuid);
    }
  }

  componentDidMount() {

    let keypressListener = this.keypressListener;

    keypressListener = new keypress.Listener();
    keypressListener = Helper.camelize(['simple_combo'], keypressListener);

    keypressListener.simpleCombo('cmd j', ::this.addDoc);
    keypressListener.simpleCombo('cmd k', this.closeTab.bind(this, null));
    keypressListener.simpleCombo('ctrl alt left', ::this.rotateTabLeft);
    keypressListener.simpleCombo('ctrl alt right', ::this.rotateTabRight);
    keypressListener.simpleCombo('ctrl s', ::this.save);

    this.saveFunc = ::this.save;
    this.onActivateTabFunc = ::this.onActivateTab;
    this.onCloseDocFunc = ::this.onCloseDoc;

    DocHelper.onSave(this.saveFunc);
    DocHelper.onActivateTab(this.onActivateTabFunc);
    DocHelper.onCloseDoc(this.onCloseDocFunc);
  }

  componentWillUnmount() {

    this.keypressListener.distroy();

    DocHelper.offSave(this.saveFunc);
    DocHelper.offActivateTab(this.onActivateTabFunc);
    DocHelper.offCloseDoc(this.onCloseDocFunc);
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  getCurrentPage(doc = this.getDoc()) {
    let pageIndex = this.getPageIndex(doc);
    return doc.pages[pageIndex];
  }

  onCodemirrorChange(cm, content) {

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
  }

  getTabName(doc) {
    let tabName = doc.name;
    if (this.docChanged(doc)) {
      return tabName + '*';
    }
    return tabName;
  }

  onUploadButtonClick() {
    let self = this;
    let doc = this.getDoc();
    let {uuid, pageIndex} = doc;
    Ipc.send('page-image-upload-button-clicked', doc)
      .then(res => {
        self.props.updatePageImagePath(uuid, pageIndex, res.destImagePath);
        self.refs.toast.success(res.message);
      })
      .catch(res => self.refs.toast.error(res.message));
  }

  getImageSrc(page) {
    return page.destImagePath;
  }

  onSettingsButtonClick() {
    let self = this;

    Ipc.send('find-doc-names')
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

  closeModalDocSettings() {
    this.refs.modalDocSettings.close();
  }

  saveAndCloseModalDocSettings(data) {
    let self = this;
    let doc = this.getDoc();
    let page = doc.pages[doc.pageIndex];
    data.doc = doc;

    if ((doc.name === data.docName) && (page.name === data.pageName)) {
      return this.refs.modalDocSettings.close();
    }

    Ipc.send('change-doc-settings', data)
      .then(res => {
        let doc = res.doc;
        self.props.receiveDoc(doc);
        self.refs.toast.success(res.message);
        self.refs.modalDocSettings.close();
      })
      .catch(res => self.refs.toast.error(res.message));
  }

  onPageAddButtonClick() {
    this.refs.modalPageAdd.open({
      pageNames: _.get(this.getDoc(), 'pages', []).map(page => page.name)
    });
  }

  onPageDeleteButtonClick() {
    this.refs.modalPageDeleteConfirm.open({
      title: 'Oops',
      message: 'Are you sure to delete this page ?'
    });
  }

  checkSpelling() {
    let codemirror = this.getCurrentCodemirror();
    let content = codemirror.getValue();

    checkSyllables(content)
      .forEach(result => {
        let [start, length] = result;
        let pos = codemirror.posFromIndex(start);
        let from = {line: pos.line, ch: pos.ch};
        let to = {line: pos.line, ch: pos.ch + length};
        codemirror.markText(from, to, {className: 'wrong-spelt'});
      });
  }

  onColorButtonClick(color) {
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

  onSpellCheckButtonClick() {
    this.checkSpelling();
  }

  getEditorKey(uuid) {
    return uuid + '.editor';
  }

  getImageZoomerKey(uuid) {
    return uuid + '.image-zoomer';
  }

  closeModalPageAdd() {
    this.refs.modalPageAdd.close();
  }

  addPageAndCloseModal(pageName) {
    let doc = this.getDoc();
    this.props.addPage(doc.uuid, pageName);
    let pageIndex = _.findIndex(doc.pages, {name: pageName});
    this.props.setPageIndex(this.state.docKey, pageIndex);
    this.refs.modalPageAdd.close();
  }

  renderImageArea(key, src) {
    if (src) {
      return <ImageZoomer key={key} className="image-zoomer" direction={this.props.settings.direction} src={src} />;
    }
    return <ImageUploader key={key} className="image-uploader" onUploadButtonClick={::this.onUploadButtonClick} />;
  }

  onApplyChunksButtonClick() {
    let doc = this.getDoc();
    this.props.toggleEditChunk(doc.uuid);
  }

  getCurrentCodemirror() {
    let uuid = _.get(this.getDoc(), 'uuid');
    let editorKey = this.getEditorKey(uuid);
    return this.refs[editorKey].codemirror;
  }

  cancelDeletePage() {
    this.refs.modalPageDeleteConfirm.close();
  }

  deleteCurrentPage() {
    let doc = this.getDoc();
    let currentPageIndex = doc.pageIndex;

    if (currentPageIndex === (doc.pages.length - 1)) {
      doc.pageIndex = currentPageIndex - 1;
      this.props.setPageIndex(currentPageIndex - 1);
    }
    this.props.deletePage(doc.uuid, currentPageIndex);
    this.refs.modalPageDeleteConfirm.close();
  }

  renderDoc(doc) {

    let pageIndex = this.getPageIndex(doc);
    let page = doc.pages[pageIndex];
    let src = this.getImageSrc(page);
    let key = doc.uuid;
    let imageZoomerKey = this.getImageZoomerKey(key);

    return (
      <TabItem eventKey={key} tab={::this.getTabName(doc)} key={key}>
        {::this.renderImageArea(imageZoomerKey, src)}
        {::this.renderEditorArea(doc, pageIndex)}
      </TabItem>
    );
  }

  applyChunk(chunk) {
    this.closeChunkEditor();
    let codemirror = this.getCurrentCodemirror();
    codemirror.replaceRange(chunk, {line: Infinity});
  }

  closeChunkEditor() {
    let doc = this.getDoc();
    this.props.toggleEditChunk(doc.uuid);
  }

  renderEditorArea(doc, pageIndex) {

    let {editChunk} = doc;

    let chunkEditorProps = {
      className: classNames({'hidden': ! editChunk}),
      hidden: ! editChunk,
      chunk: doc.chunk,
      inputMethod: this.props.settings.inputMethod,
      apply: ::this.applyChunk,
      cancel: ::this.closeChunkEditor
    };

    let page = doc.pages[pageIndex];

    let key = doc.uuid;
    let editorKey = this.getEditorKey(key);
    let {setInputMethod, toggleReadonly, setFontSize, setLineHeight,
      setLetterSpacing} = this.props;

    let editorProps = {
      className: classNames({'editor': true, 'hidden': editChunk}),
      pageIndex,
      onInputChange: ::this.onInputChange,
      code: page.content,
      ref: editorKey,
      key: editorKey,
      settings: this.props.settings,
      onCodemirrorChange: ::this.onCodemirrorChange,
      onSettingsButtonClick: ::this.onSettingsButtonClick,
      onPageAddButtonClick: ::this.onPageAddButtonClick,
      onSpellCheckButtonClick: ::this.onSpellCheckButtonClick,
      onColorButtonClick: ::this.onColorButtonClick,
      onReadonlyButtonClick: toggleReadonly,
      onApplyChunksButtonClick: ::this.onApplyChunksButtonClick,
      onPageDeleteButtonClick: ::this.onPageDeleteButtonClick,
      canShowPageDeleteButton: doc.pages.length > 1,
      setInputMethod,
      setFontSize,
      setLineHeight,
      setLetterSpacing,
      pageNames: doc.pages.map(page => page.name)
    };

    return (
      <span>
        <ChunkEditor {...chunkEditorProps} />
        <Editor {...editorProps} />
      </span>
    );
  }

  render() {
    let {docs, settings} = this.props;
    let classes = {
      [this.props.className]: true,
      'vertical': settings.direction
    };
    return (
      <div className={classNames(classes)}>
        <TabBox className="tab-box" activeKey={this.state.docKey} onSelect={::this.handleSelect} onClose={::this.handleClose}>
          {docs.map(::this.renderDoc)}
          <TabItem className="button-add" eventKey={KEY_ADD_DOC} noCloseButton tab="+" />
        </TabBox>
        <ModalConfirm ref="modalSaveConfirm" confirmText="Save and close" confirm={::this.saveAndClose} cancelText="Discard" cancel={::this.discard} />
        <ModalConfirm ref="modalPageDeleteConfirm" confirmText="Delete"
          confirm={::this.deleteCurrentPage} cancelText="Cancel" cancel={::this.cancelDeletePage} />
        <ModalDocSettings ref="modalDocSettings" cancel={::this.closeModalDocSettings} confirm={::this.saveAndCloseModalDocSettings} />
        <ModalPageAdd ref="modalPageAdd" cancel={::this.closeModalPageAdd} confirm={::this.addPageAndCloseModal} />
        <ToastContainer ref="toast" toastMessageFactory={ToastMessageFactory} className="toast-top-right" />
      </div>
    );
  }
}
