import React, {PropTypes} from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import keypress from 'keypress.js';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Editor, ImageZoomer, ImageUploader, TabBox, TabItem, ModalConfirm,
  ModalDocSettings, ModalPageAdd, ModalChunksApply} from '.';
import {DocHelper, Helper} from '../services/';

import ReactToastr from 'react-toastr';

let {ToastContainer} = ReactToastr;
let ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);

let ipc = window.require('ipc');

const KEY_ADD_DOC = 'KEY_ADD_DOC';

export default class EditorArea extends React.Component {

  static PropTypes = {
    addDoc: PropTypes.func.isRequired,
    addPage: PropTypes.func.isRequired,
    closeDoc: PropTypes.func.isRequired,
    direction: PropTypes.bool.isRequired,
    docs: PropTypes.array.isRequired,
    inputMethod: PropTypes.string.isRequired,
    save: PropTypes.func.isRequired,
    setInputMethod: PropTypes.func.isRequired,
    toggleReadonly: PropTypes.func.isRequired,
    readonly: PropTypes.bool.isRequired,
    writePageContent: PropTypes.func.isRequired
  };

  keypressListener = null;

  constructor(props, context) {
    super(props, context);

    let doc = this.props.docs[0];

    this.state = {
      docKey: doc.uuid
    };
    this.state.pageInputValue = this.getPageInputValue();
  }

  handleSelect(key) {
    if (KEY_ADD_DOC === key) {
      return this.addDoc();
    }
    if (key !== this.state.docKey) {
      let doc = this.getDoc(key);
      let page = doc.pages[doc.pageIndex];
      let state = {docKey: key};

      if (page) {
        state.pageInputValue = this.getPageInputValue(page);
      }
      this.setState(state);
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
    ipc.send('add-doc');
  }

  componentDidUpdate(previousProps) {
    let docs = this.props.docs;
    if (previousProps.docs.length < docs.length) {
      this.activateTab(docs.length - 1);
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
      this.refs.modalConfirm.open({
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
    this.refs.modalConfirm.close();
  }

  discard() {
    this.closeDoc();
    this.refs.modalConfirm.close();
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

  getDoc(key = this.state.docKey) {
    return this.props.docs.find(doc => doc.uuid === key);
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
    let doc = this.getDoc();
    ipc.send('save', doc);
  }

  onImport() {
    let uuid = _.get(this.getDoc(), 'uuid');
    this.refs[this.getEditorKey(uuid)].refresh();
  }

  componentDidMount() {
    let self = this;
    let keypressListener = this.keypressListener;

    keypressListener = new keypress.Listener();
    keypressListener = Helper.camelize(['simple_combo'], keypressListener);

    keypressListener.simpleCombo('cmd j', ::this.addDoc);
    keypressListener.simpleCombo('cmd k', this.closeTab.bind(this, null));
    keypressListener.simpleCombo('shift left', ::this.rotateTabLeft);
    keypressListener.simpleCombo('shift right', ::this.rotateTabRight);
    keypressListener.simpleCombo('ctrl s', ::this.save);

    this.saveFunc = ::this.save;
    this.onImportFunc = ::this.onImport;

    DocHelper.onSave(this.saveFunc);
    DocHelper.onImport(this.onImportFunc);

    ipc.on('save-done', function() {
      self.props.save(self.state.docKey);
    });

    ipc.on('save-error', function(res) {
      self.refs.toast.error(res.message);
    });

    ipc.on('page-image-upload-done', function(res) {
      let doc = self.getDoc();
      let page = self.getCurrentPage(doc);
      page.destImagePath = res.destImagePath;
      doc.changed = true;
      self.forceUpdate();
      self.refs.toast.success(res.message);
    });

    ipc.on('page-image-upload-error', function(res) {
      self.refs.toast.error(res.message);
    });

    ipc.on('add-doc-done', function(res) {
      let doc = res.doc;
      self.props.addDoc(doc);
      self.refs[self.getEditorKey(doc.uuid)].refresh();
    });

    ipc.on('add-doc-error', function(res) {
      self.refs.toast.error(res.message);
    });

    ipc.on('find-doc-names-done', function(docNames) {
      let doc = self.getDoc();
      let page = self.getCurrentPage(doc);
      self.refs.modalDocSettings.open({
        docName: _.get(doc, 'name'),
        pageName: _.get(page, 'name'),
        docNames,
        pageNames: _.get(doc, 'pages', []).map(page => page.name)
      });
    });

    ipc.on('change-doc-settings-error', function(res) {
      self.refs.toast.error(res.message);
    });

    ipc.on('change-doc-settings-done', function(res) {
      let doc = res.doc;
      self.props.addDoc(doc);
      self.setState({
        pageInputValue: self.getPageInputValue()
      });
      self.refs.toast.success(res.message);
    });
  }

  componentWillUnmount() {
    this.keypressListener.distroy();
    DocHelper.offSave(this.saveFunc);
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  getCurrentPage(doc = this.getDoc()) {
    let pageIndex = this.getPageIndex(doc);
    return doc.pages[pageIndex];
  }

  onCodemirrorChange(cm, content) {
    let doc = this.getDoc();
    this.props.writePageContent(doc.uuid, doc.pageIndex, content);
    this.forceUpdate();
  }

  getTabName(doc) {
    let tabName = doc.name;
    if (this.docChanged(doc)) {
      return tabName + '*';
    }
    return tabName;
  }

  onUploadButtonClick() {
    let doc = this.getDoc();
    ipc.send('page-image-upload-button-clicked', doc);
  }

  getImageSrc(page) {
    return page.destImagePath;
  }

  onSettingsButtonClick() {
    ipc.send('find-doc-names');
  }

  closeModalDocSettings() {
    this.refs.modalDocSettings.close();
  }

  saveAndCloseModalDocSettings(data) {
    let doc = this.getDoc();
    let page = doc.pages[doc.pageIndex];
    data.doc = doc;

    if ((doc.name === data.docName) && (page.name === data.pageName)) {
      return this.refs.modalDocSettings.close();
    }

    ipc.send('change-doc-settings', data);
    this.refs.modalDocSettings.close();
  }

  onPageAddButtonClick() {
    this.refs.modalPageAdd.open({
      pageNames: _.get(this.getDoc(), 'pages', []).map(page => page.name)
    });
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
    this.props.setPageIndex(this.state.docKey, doc.pages.length);
    this.setState({
      pageInputValue: pageName
    });
    this.refs.modalPageAdd.close();
  }

  renderImageArea(key, src) {
    if (src) {
      return <ImageZoomer key={key} className="image-zoomer" direction={this.props.direction} src={src} />;
    }
    return <ImageUploader key={key} className="image-uploader" onUploadButtonClick={::this.onUploadButtonClick} />;
  }

  onApplyChunksButtonClick() {
    this.refs.modalChunksApply.open({
      chunks: _.get(this.getDoc(), 'chunks', [])
    });
  }

  closeModalChunksApply() {
    this.refs.modalChunksApply.close();
  }

  applyChunksAndClose(chunks) {
    let uuid = _.get(this.getDoc(), 'uuid');
    let editorKey = this.getEditorKey(uuid);
    let codemirror = this.refs[editorKey].codemirror;
    let content = '\n\n' + chunks.join('\n\n');
    codemirror.replaceRange(content, {line: Infinity});
    this.refs.modalChunksApply.close();
  }

  renderDoc(doc) {

    let pageIndex = this.getPageIndex(doc);
    let page = doc.pages[pageIndex];
    let src = this.getImageSrc(page);
    let key = doc.uuid;
    let editorKey = this.getEditorKey(key);
    let imageZoomerKey = this.getImageZoomerKey(key);
    let {readonly, toggleReadonly} = this.props;

    let editorProps = {
      className: 'editor',
      pageIndex: pageIndex,
      onInputChange: ::this.onInputChange,
      code: page.content,
      inputMethod: this.props.inputMethod,
      ref: editorKey,
      key: editorKey,
      readonly,
      onCodemirrorChange: ::this.onCodemirrorChange,
      onSettingsButtonClick: ::this.onSettingsButtonClick,
      onPageAddButtonClick: ::this.onPageAddButtonClick,
      onReadonlyButtonClick: toggleReadonly,
      onApplyChunksButtonClick: ::this.onApplyChunksButtonClick,
      setInputMethod: this.props.setInputMethod,
      pageNames: doc.pages.map(page => page.name)
    };

    return (
      <TabItem eventKey={key} tab={::this.getTabName(doc)} key={key}>
        {::this.renderImageArea(imageZoomerKey, src)}
        <Editor {...editorProps} />
      </TabItem>
    );
  }

  render() {
    let {docs, direction, inputMethod} = this.props;
    let classes = {
      [this.props.className]: true,
      'vertical': direction
    };
    return (
      <div className={classNames(classes)}>
        <TabBox className="tab-box" activeKey={this.state.docKey} onSelect={::this.handleSelect} onClose={::this.handleClose}>
          {docs.map(::this.renderDoc)}
          <TabItem className="button-add" eventKey={KEY_ADD_DOC} noCloseButton tab="+" />
        </TabBox>
        <ModalConfirm ref="modalConfirm" confirmText="Save and close" confirm={::this.saveAndClose} cancelText="Discard" cancel={::this.discard} />
        <ModalDocSettings ref="modalDocSettings" cancel={::this.closeModalDocSettings} confirm={::this.saveAndCloseModalDocSettings} />
        <ModalPageAdd ref="modalPageAdd" cancel={::this.closeModalPageAdd} confirm={::this.addPageAndCloseModal} />
        <ModalChunksApply ref="modalChunksApply" cancel={::this.closeModalChunksApply} confirm={::this.applyChunksAndClose} inputMethod={inputMethod} />
        <ToastContainer ref="toast" toastMessageFactory={ToastMessageFactory} className="toast-top-right" />
      </div>
    );
  }
}
