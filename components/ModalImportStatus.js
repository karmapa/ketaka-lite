import React from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Alert, Button, Modal, ProgressBar} from 'react-bootstrap';
import _ from 'lodash';

export default class ModalImportStatus extends React.Component {

  state = {
    show: false,
    progress: 0,
    messages: [],
  };

  onModalHide() {
  }

  open(args) {
    this.setState(_.extend({
      show: true
    }, args));
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
      state.messages = [...this.state.messages, {type: args.type, message: args.message}];
    }
    this.setState(state);
  }

  close() {
    this.setState({
      show: false,
      messages: [],
      progress: 0
    });
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {

    let {className} = this.props;
    let {show, progress, messages} = this.state;

    return (
      <Modal show={show} className={className} backdrop="static" onHide={::this.onModalHide}>
        <Modal.Header>
          <Modal.Title>Import Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <ProgressBar active bsStyle="info" now={progress} />
        {this.renderMessages(messages)}
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle='primary' onClick={::this.close}>OK</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  renderMessages(messages) {
    return _.chain(messages)
      .groupBy('type')
      .map((rows, type) => (<Alert key={type} bsStyle={type}>{this.renderRows(rows)}</Alert>))
      .value();
  }

  renderRows(rows) {
    return rows.map((row, index) => (<p key={row.type + index}>{row.message}</p>));
  }
}
