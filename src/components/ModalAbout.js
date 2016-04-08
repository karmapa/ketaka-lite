import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import {connect} from 'react-redux';
import {openModal, closeModal} from '../modules/modalAbout';

@connect(state => ({
  appVersion: state.app.appVersion,
  electronVersion: state.app.electronVersion,
  isModalVisible: state.modalAbout.isModalVisible
}), {openModal, closeModal}, null, {withRef: true})
export default class ModalAbout extends React.Component {

  static PropTypes = {
    appVersion: PropTypes.string.isRequired,
    electronVersion: PropTypes.string.isRequired,
    openModal: PropTypes.func.isRequired,
    closeModal: PropTypes.func.isRequired
  };

  openModal = () => {
    this.props.openModal();
  };

  closeModal = () => this.props.closeModal();

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {

    const {appVersion, electronVersion, isModalVisible} = this.props;

    return (
      <Modal show={isModalVisible}>
        <Modal.Header>
          <Modal.Title>About KETAKA Lite</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {`Version ${electronVersion} (${appVersion})`}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.closeModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
