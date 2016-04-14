import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import {extend} from 'lodash';

export default class ModalConfirm extends React.Component {

  static PropTypes = {
    cancel: PropTypes.func.isRequired,
    confirm: PropTypes.func.isRequired,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string
  };

  state = {
    show: false,
    title: '',
    message: ''
  };

  open(args) {
    this.setState(extend({
      show: true,
      title: '',
      message: ''
    }, args));
  }

  close() {
    this.setState({
      show: false,
      title: '',
      message: ''
    });
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    const {cancel, confirm, cancelText, confirmText} = this.props;
    const {show, title, message} = this.state;

    return (
      <Modal show={show}>
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{message}</Modal.Body>
        <Modal.Footer>
          <Button onClick={cancel}>{cancelText || 'Cancel'}</Button>
          <Button bsStyle="primary" onClick={confirm}>{confirmText || 'Confirm'}</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
