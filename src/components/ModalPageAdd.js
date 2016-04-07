import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Input, Modal} from 'react-bootstrap';
import {isEmpty} from 'lodash';

export default class ModalPageAdd extends React.Component {

  static PropTypes = {
    cancel: PropTypes.func.isRequired,
    confirm: PropTypes.func.isRequired
  }

  pageNames = [];

  state = {
    show: false,
    loading: false,
    dirty: false,
    pageName: '',
  };

  open(args) {
    let {pageNames} = args;
    this.pageNames = pageNames;
    this.setState({
      show: true,
      loading: false,
      dirty: false
    });
  }

  close() {
    this.setState({
      show: false,
      loaing: false,
      dirty: false,
      pageName: ''
    });
  }

  onModalHide() {
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

  pageNameHelp = () => {
    if (! this.state.dirty) {
      return '';
    }
    let {pageName} = this.state;
    if (isEmpty(pageName)) {
      return 'Page name cannot be empty.';
    }
    if (this.isPageNameExisted(pageName) && (pageName !== this.originPageName)) {
      return 'Page name ' + pageName + ' is existed in this doc, try another one.';
    }
    return '';
  }

  pageNameState = () => {
    if (! this.state.dirty) {
      return 'success';
    }
    return this.isValidPageName() ? 'success' : 'error';
  }

  onPageNameChange = e => {
    this.setState({
      dirty: true,
      pageName: e.target.value
    });
  }

  confirm = () => {
    if (this.isValidPageName()) {
      this.setState({
        loading: true
      });
      this.props.confirm(this.state.pageName);
    }
  }

  onInputBlur = () => {
    this.setState({
      dirty: true
    });
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    let {cancel} = this.props;
    let {show, pageName, loading} = this.state;

    return (
      <Modal show={show} onHide={this.onModalHide}>
        <Modal.Header>
          <Modal.Title>Add New Page</Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <Input type="text" value={pageName} placeholder="Enter text"
                 onBlur={this.onInputBlur}
                 label="Page Name" help={this.pageNameHelp()} bsStyle={this.pageNameState()}
                 hasFeedback ref="currentPageName" groupClassName="group-class" labelClassName="label-class" onChange={this.onPageNameChange} />
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={cancel}>Cancel</Button>
          <Button bsStyle="primary" onClick={this.confirm} disabled={(! this.isValidPageName() || (loading))}>Add New Page</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
