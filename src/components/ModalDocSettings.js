import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Input, Modal} from 'react-bootstrap';
import {isEmpty, pick} from 'lodash';

export default class ModalDocSettings extends React.Component {

  static PropTypes = {
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

  close = () => {
    this.setState({
      show: false,
      loading: false,
    });
  };

  isValidDocNameFormat(name) {
    return name.match(/^[a-zA-Z0-9\-]+$/);
  }

  isDocNameExisted(docName) {
    return this.docNames.includes(docName);
  }

  isValidDocName = () => {
    let {docName} = this.state;
    let {originDocName} = this;

    if (isEmpty(docName)) {
      return false;
    }
    if (! this.isValidDocNameFormat(docName)) {
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

  isValidPageName = () => {
    let {pageName} = this.state;
    if (isEmpty(pageName)) {
      return false;
    }
    if (pageName === this.originPageName) {
      return true;
    }
    return ! this.isPageNameExisted(pageName);
  }

  pageNameHelp() {
    let {pageName} = this.state;
    if (isEmpty(pageName)) {
      return 'Page name cannot be empty.';
    }
    if (this.isPageNameExisted(pageName) && (pageName !== this.originPageName)) {
      return 'Page name ' + pageName + ' is existed in this doc, try another one.';
    }
    return '';
  }

  docNameHelp = () => {
    let {docName} = this.state;

    if (isEmpty(docName)) {
      return 'Doc name cannot be empty.';
    }
    if (! this.isValidDocNameFormat(docName)) {
      return 'Doc name can only consist of lowercase letters, capitalized letters or digits.';
    }
    if (this.isDocNameExisted(docName) && (docName !== this.originDocName)) {
      return 'Doc name ' + docName + ' is existed in file system, try another one.';
    }
    return '';
  }

  docNameState = () => {
    return this.isValidDocName() ? 'success' : 'error';
  }

  pageNameState = () => {
    return this.isValidPageName() ? 'success' : 'error';
  }

  onDocNameChange = e => {
    this.setState({
      docName: e.target.value.toLowerCase()
    });
  }

  onPageNameChange = e => {
    this.setState({
      pageName: e.target.value
    });
  }

  confirm = () => {
    if (this.isValidDocName() && this.isValidPageName()) {
      this.setState({
        loading: true
      });
      this.props.confirm(pick(this.state, ['docName', 'pageName']));
    }
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    let {show, docName, pageName, loading} = this.state;

    return (
      <Modal show={show}>
        <Modal.Header>
          <Modal.Title>Doc Settings</Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <Input type="text" value={docName} placeholder="Enter text"
                 label="Doc Name" help={this.docNameHelp()} bsStyle={this.docNameState()}
                 hasFeedback ref="docName" groupClassName="group-class" labelClassName="label-class" onChange={this.onDocNameChange} />

          <Input type="text" value={pageName} placeholder="Enter text"
                 label="Current Page Name" help={this.pageNameHelp()} bsStyle={this.pageNameState()}
                 hasFeedback ref="currentPageName" groupClassName="group-class" labelClassName="label-class" onChange={this.onPageNameChange} />
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={this.close}>Cancel</Button>
          <Button bsStyle="primary" onClick={this.confirm} disabled={(! this.isValidDocName()) || (! this.isValidPageName() || (loading))}>Save and close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
