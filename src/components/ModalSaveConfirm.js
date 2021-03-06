import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import {extend, isFunction} from 'lodash';

export default class ModalSaveConfirm extends React.Component {

  static PropTypes = {
    cancel: PropTypes.func,
    confirm: PropTypes.func.isRequired,
    discard: PropTypes.func.isRequired
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

  onModalHide() {
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    const {cancel, confirm, discard} = this.props;
    const {show, title, message} = this.state;

    return (
      <Modal show={show} onHide={this.onModalHide}>
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{message}</Modal.Body>
        <Modal.Footer>
          {isFunction(cancel) && <Button onClick={cancel}>Cancel</Button>}
          <Button onClick={discard}>Discard</Button>
          <Button bsStyle="primary" onClick={confirm}>Save and close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
