import React, {PropTypes, Component} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import {connect} from 'react-redux';
import {openModal, closeModal} from '../modules/modalEditDocs';

@connect(state => ({
  isModalVisible: state.modalEditDocs.isModalVisible
}), {openModal, closeModal}, null, {withRef: true})
export default class ModalEditDocs extends Component {

  static PropTypes = {
    isModalVisible: PropTypes.bool.isRequired,
    openModal: PropTypes.func.isRequired,
    closeModal: PropTypes.func.isRequired
  };

  openModal = () => this.props.openModal();

  closeModal = () => this.props.closeModal();

  shouldComponentUpdate = shouldPureComponentUpdate;

  deleteSelectedDocs = () => {
  };

  render() {
    let {isModalVisible} = this.props;
    return (
      <Modal show={isModalVisible} onHide={() => {}}>
        <Modal.Header>
          <Modal.Title>
            <span>Edit Docs</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.closeModal}>Cancel</Button>
          <Button bsStyle="danger" onClick={this.deleteSelectedDocs}>Delete</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
