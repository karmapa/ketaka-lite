import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Input, Modal} from 'react-bootstrap';
import _ from 'lodash';

export default class ModalDocSettings extends React.Component {

  static PropTypes = {
    cancel: PropTypes.func.isRequired,
    confirm: PropTypes.func.isRequired
  }

  originDocName = null;
  originPageName = null;
  docNames = [];
  pageNames = [];

  state = {
    show: false,
    docName: '',
    pageName: ''
  };

  open(args) {
    let {docName, pageName, docNames, pageNames} = args;
    this.originDocName = docName;
    this.originPageName = pageName;
    this.docNames = docNames;
    this.pageNames = pageNames;
    this.setState({
      show: true,
      loading: false,
      docName,
      pageName
    });
  }

  close() {
    this.originDocName = null;
    this.originPageName = null;
    this.setState({
      show: false,
      loaing: false,
      docName: ''
    });
  }

  onModalHide() {
  }

  isDocNameExisted(docName) {
    return this.docNames.includes(docName);
  }

  isValidDocName() {
    let {docName} = this.state;
    let {originDocName} = this;

    if (_.isEmpty(docName)) {
      return false;
    }
    if (docName === originDocName) {
      return true;
    }
    return ! this.isDocNameExisted(docName);
  }

  isPageNameExisted(pageName) {
    return this.pageNames.includes(pageName);
  }

  isValidPageName() {
    let {pageName} = this.state;
    if (_.isEmpty(pageName)) {
      return false;
    }
    if (pageName === this.originPageName) {
      return true;
    }
    return ! this.isPageNameExisted(pageName);
  }

  pageNameHelp() {
    let {pageName} = this.state;
    if (_.isEmpty(pageName)) {
      return 'Page name cannot be empty.';
    }
    if (this.isPageNameExisted(pageName) && (pageName !== this.originPageName)) {
      return 'Page name ' + pageName + ' is existed in this doc, try another one.';
    }
    return '';
  }

  docNameHelp() {
    let {docName} = this.state;

    if (_.isEmpty(docName)) {
      return 'Doc name cannot be empty.';
    }
    if (this.isDocNameExisted(docName) && (docName !== this.originDocName)) {
      return 'Doc name ' + docName + ' is existed in file system, try another one.';
    }
    return '';
  }

  docNameState() {
    return this.isValidDocName() ? 'success' : 'error';
  }

  pageNameState() {
    return this.isValidPageName() ? 'success' : 'error';
  }

  onDocNameChange(e) {
    this.setState({
      docName: e.target.value
    });
  }

  onPageNameChange(e) {
    this.setState({
      pageName: e.target.value
    });
  }

  confirm() {
    if (this.isValidDocName() && this.isValidPageName()) {
      this.setState({
        loading: true
      });
      this.props.confirm(_.pick(this.state, ['docName', 'pageName']));
    }
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    let {cancel} = this.props;
    let {show, docName, pageName, loading} = this.state;

    return (
      <Modal show={show} onHide={this.onModalHide}>
        <Modal.Header>
          <Modal.Title>Doc Settings</Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <Input type="text" value={docName} placeholder="Enter text"
                 label="Doc Name" help={::this.docNameHelp()} bsStyle={::this.docNameState()}
                 hasFeedback ref="docName" groupClassName="group-class" labelClassName="label-class" onChange={::this.onDocNameChange} />

          <Input type="text" value={pageName} placeholder='Enter text'
                 label="Current Page Name" help={::this.pageNameHelp()} bsStyle={::this.pageNameState()}
                 hasFeedback ref="currentPageName" groupClassName="group-class" labelClassName="label-class" onChange={::this.onPageNameChange} />
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={cancel}>Cancel</Button>
          <Button bsStyle="primary" onClick={::this.confirm} disabled={(! ::this.isValidDocName()) || (! ::this.isValidPageName() || (loading))}>Save and close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
