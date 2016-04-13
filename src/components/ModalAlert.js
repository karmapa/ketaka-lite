import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import {connect} from 'react-redux';
import {openModal, closeModal} from '../modules/modalAlert';

@connect(state => ({
  title: state.modalAlert.title,
  message: state.modalAlert.message,
  isModalVisible: state.modalAlert.isModalVisible
}), {openModal, closeModal}, null, {withRef: true})
export default class ModalAlert extends React.Component {

  static PropTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    openModal: PropTypes.func.isRequired,
    closeModal: PropTypes.func.isRequired
  };

  openModal = args => this.props.openModal(args);

  closeModal = () => this.props.closeModal();

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {

    const {title, message, isModalVisible} = this.props;

    return (
      <Modal show={isModalVisible}>
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.closeModal}>OK</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
