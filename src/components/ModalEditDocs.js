import React, {PropTypes, Component} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import {connect} from 'react-redux';
import {openModal, closeModal, loadDocNames, setDocs,
  showWarning, hideWarning} from '../modules/modalEditDocs';
import {find, clone, map} from 'lodash';
import classNames from 'classnames';
import Api from '../services/Api';

@connect(state => ({
  docs: state.modalEditDocs.docs,
  isModalVisible: state.modalEditDocs.isModalVisible,
  isWarningVisible: state.modalEditDocs.isWarningVisible,
  openedDocs: state.doc
}), {openModal, closeModal, loadDocNames, setDocs, showWarning, hideWarning}, null, {withRef: true})
export default class ModalEditDocs extends Component {

  static PropTypes = {
    closeModal: PropTypes.func.isRequired,
    docs: PropTypes.array.isRequired,
    hideWarning: PropTypes.func.isRequired,
    isModalVisible: PropTypes.bool.isRequired,
    isWarningVisible: PropTypes.bool.isRequired,
    openModal: PropTypes.func.isRequired,
    openedDocs: PropTypes.array.isRequired,
    setDocs: PropTypes.func.isRequired,
    showWarning: PropTypes.func.isRequired
  };

  openModal = () => {
    this.props.loadDocNames();
    this.props.openModal();
  };

  closeModal = () => this.props.closeModal();

  shouldComponentUpdate = shouldPureComponentUpdate;

  deleteSelectedDocs = () => {
    this.props.hideWarning();
    const docNames = this.getSelectedDocs().map(doc => doc.name);
    Api.send('delete-docs', {docNames})
      .then(() => {
        this.props.loadDocNames();
        this.closeModal();
      });
  };

  handleCheckboxChange = event => {
    const {checked, value} = event.target;
    const {docs, setDocs} =  this.props;
    const checkedDoc = find(docs, {name: value});
    checkedDoc.checked = checked;
    setDocs(clone(docs));
  };

  renderOpenedDocs = () => {

    const {openedDocs} = this.props;

    if (openedDocs.length > 0) {

      return (
        <div className="box-opened-names">
          <span>Opened Docs:</span>
          {openedDocs.map(doc => {
            return (
              <span key={'span-' + doc.name} className="text">{doc.name}</span>
            );
          })}
        </div>
      );
    }
  };

  renderDocsContent = () => {

    const {docs, openedDocs} = this.props;
    const openedDocNames = map(openedDocs, 'name');
    const closed = doc => -1 === openedDocNames.indexOf(doc.name);

    return docs.filter(closed)
      .map(doc => (
        <label key={'item-' + doc.name} className={classNames({item: true, active: doc.checked})}>
          <input type="checkbox" onChange={this.handleCheckboxChange} checked={doc.checked} value={doc.name} />
          <span className="text">{doc.name}</span>
        </label>
      ));
  };

  renderDocs = () => {
    return <div className="box-doc-names">{this.renderDocsContent()}</div>;
  };

  getSelectedDocs = () => this.props.docs.filter(doc => doc.checked);

  renderSelectedMessage = () => {
    const selectedCount = this.getSelectedDocs().length;
    if (selectedCount > 0) {
      return (
        <span className="box-selected">Selected {selectedCount} items</span>
      );
    }
    return false;
  };

  renderBody = () => {
    if (this.props.isWarningVisible) {
      return (
        <div className="box-warning">
          <p>There is no way to recover deleted items.</p>
          <p> Are you sure you want to do this ?</p>
        </div>
      );
    }
    else {
      return (
        <div>
          {this.renderOpenedDocs()}
          {this.renderDocs()}
        </div>
      );
    }
  }

  renderButtons = () => {

    const selectedCount = this.getSelectedDocs().length;

    if (this.props.isWarningVisible) {
      return (
        <div>
          {this.renderSelectedMessage()}
          <Button onClick={this.props.hideWarning}>Cancel</Button>
          {(selectedCount > 0) && <Button bsStyle="danger" onClick={this.deleteSelectedDocs}>Yes. I know what I am doing.</Button>}
        </div>
      );
    }
    else {
      return (
        <div>
          {this.renderSelectedMessage()}
          <Button onClick={this.closeModal}>Cancel</Button>
          {(selectedCount > 0) && <Button bsStyle="danger" onClick={this.props.showWarning}>Delete</Button>}
        </div>
      );
    }
  };

  render() {
    const {isModalVisible} = this.props;
    return (
      <Modal show={isModalVisible}>
        <Modal.Header>
          <Modal.Title>
            <span>Edit Docs</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderBody()}
        </Modal.Body>
        <Modal.Footer>
          {this.renderButtons()}
        </Modal.Footer>
      </Modal>
    );
  }
}
