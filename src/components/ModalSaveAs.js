import React, { PropTypes } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal, Input} from 'react-bootstrap';
import _ from 'lodash';

export default class ModalSaveAs extends React.Component {

  static PropTypes = {
    saveAs: PropTypes.func.isRequired
  };

  state = {
    docName: '',
    show: false,
    dirty: false
  };

  docNames = [];

  open(args = {}) {
    let {docName, docNames} = args;
    this.originDocName = docName;
    this.docNames = docNames;
    this.setState({
      docName: docName,
      show: true
    });
  }

  close = () => {
    this.setState({
      show: false
    });
  }

  onModalHide() {
  }

  onDocNameInputBlur = () => {
    this.setState({
      dirty: true
    });
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  isDocNameExisted(docName) {
    return this.docNames.includes(docName);
  }

  isValidDocName = () => {
    let {docName} = this.state;
    if (_.isEmpty(docName)) {
      return false;
    }
    if (docName === this.originDocName) {
      return true;
    }
    return ! this.isDocNameExisted(docName);
  }

  getDocNameInputHelp = () => {
    if (! this.state.dirty) {
      return '';
    }
    let {docName} = this.state;
    if (_.isEmpty(docName)) {
      return 'Doc name cannot be empty.';
    }
    if (this.isDocNameExisted(docName) && (docName !== this.originDocName)) {
      return 'Doc name ' + docName + ' is existed, try another one.';
    }
    return '';
  }

  getDocNameInputState = () => {
    if (! this.state.dirty) {
      return 'success';
    }
    return this.isValidDocName() ? 'success' : 'error';
  }

  onDocNameInputChange = e => {
    this.setState({
      dirty: true,
      docName: e.target.value
    });
  }

  saveAs = () => {
    if (this.state.docName === this.originDocName) {
      this.close();
    }
    else {
      this.props.saveAs(this.state.docName);
    }
  }

  cancel = () => {
    this.close();
  }

  render() {

    let {show, docName} = this.state;

    let docNameInputProps = {
      bsStyle: this.getDocNameInputState(),
      groupClassName: 'group-class',
      hasFeedback: true,
      help: this.getDocNameInputHelp(),
      label: 'Doc Name',
      labelClassName: 'label-class',
      onBlur: this.onDocNameInputBlur,
      onChange: this.onDocNameInputChange,
      placeholder: 'Doc Name',
      ref: 'docName',
      type: 'text',
      value: docName
    };

    return (
      <Modal show={show} onHide={this.onModalHide}>
        <Modal.Header>
          <Modal.Title>Save As</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <Input {...docNameInputProps} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.cancel}>Cancel</Button>
          <Button onClick={this.saveAs} disabled={(! this.isValidDocName())}>SaveAs</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
