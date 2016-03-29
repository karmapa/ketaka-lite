import React from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Alert, Button, Modal, ProgressBar} from 'react-bootstrap';
import _ from 'lodash';

export default class ModalImportStatus extends React.Component {

  state = {
    show: false,
    showPrompt: false,
    progressStyle: 'info',
    progress: 0,
    messages: [],
  };

  onModalHide() {
  }

  confirm() {
  }

  open(args) {
    this.setState(_.extend({
      show: true
    }, args));
  }

  showPrompt(args) {
    this.confirm = args.confirm || (() => {});
    this.setState({
      showPrompt: true,
      progressStyle: 'warning',
      promptMessage: args.promptMessage
    });
  }

  hidePrompt() {
    this.setState({
      progressStyle: 'info',
      showPrompt: false
    });
  }

  addMessage(args) {
    let state = {};

    if (_.isArray(args)) {
      state.messages = [...this.state.messages, ...args];
    }
    else {
      if ('progress' in args) {
        state.progress = args.progress;
      }
      if (args.clean) {
        state.messages = [{type: args.type, message: args.message}];
      }
      else {
        state.messages = [{type: args.type, message: args.message}, ...this.state.messages];
      }
    }
    this.setState(state);
  }

  close = () => {
    this.setState({
      show: false,
      showPrompt: false,
      promptMessage: '',
      messages: [],
      progressStyle: 'info',
      progress: 0
    });
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {

    let {className} = this.props;
    let {show, progress, messages, progressStyle} = this.state;

    return (
      <Modal show={show} className={className} backdrop="static" onHide={this.onModalHide}>
        <Modal.Header>
          <Modal.Title>Import Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProgressBar active bsStyle={progressStyle} now={progress} />
          {this.renderMessages(messages)}
        </Modal.Body>
        <Modal.Footer>
          {this.renderButtons()}
        </Modal.Footer>
      </Modal>
    );
  }

  renderButtons() {

    const {showPrompt, progress} = this.state;

    if (showPrompt) {
      return (
        <div>
          <Button onClick={this.close}>Cancel</Button>
          <Button bsStyle="warning" onClick={this.confirm}>Proceed</Button>
        </div>
      );
    }
    else if (100 === progress) {
      return <Button bsStyle="primary" onClick={this.close}>OK</Button>;
    }
  }

  renderMessages(messages) {

    if (this.state.showPrompt) {
      return (
        <Alert bsStyle="warning">{this.state.promptMessage}</Alert>
      );
    }
    else {
      return _.chain(messages)
        .groupBy('type')
        .map((rows, type) => (<Alert key={type} bsStyle={type}>{this.renderRows(rows)}</Alert>))
        .value();
    }
  }

  renderRows(rows) {
    return rows.map((row, index) => (<p key={row.type + index}>{row.message}</p>));
  }
}
