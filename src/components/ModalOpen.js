import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import {extend} from 'lodash';
import classNames from 'classnames';

export default class ModalConfirm extends React.Component {

  static PropTypes = {
    onBambooClick: PropTypes.func.isRequired,
    onBambooDeleteClick: PropTypes.func.isRequired
  };

  state = {
    show: false,
    isEdit: false,
    names: []
  };

  open(args) {
    this.setState(extend({
      show: true,
      isEdit: false,
      names: args.names
    }, args));
  }

  setNames(names) {
    this.setState({
      names
    });
  }

  close = () => {
    this.setState({
      show: false,
      isEdit: false,
      names: []
    });
  }

  toggleEditMode() {
    this.setState({
      isEdit: ! this.state.isEdit
    });
  }

  showEditButtonText() {
    return this.state.isEdit ? 'Cancel Edit' : 'Edit';
  }

  onBambooClick(name) {
    if (this.state.isEdit) {
      return;
    }
    this.props.onBambooClick(name);
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    let {show} = this.state;
    return (
      <Modal show={show}>
        <Modal.Header>
          <Modal.Title>
            <div className="modal-open-title">
              <span>Docs</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="modal-open-content">
            {this.renderBamboos()}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  renderBamboos() {
    let {names} = this.state;
    let {onBambooDeleteClick} = this.props;
    let buttonDeleteClasses = {
      'button-delete': true,
      'hidden': ! this.state.isEdit
    };
    return names.map((name, index) => {
      return (
        <span className="button-wrap" key={index}>
          <Button className={classNames(buttonDeleteClasses)} onClick={onBambooDeleteClick.bind(this, name)}>&times;</Button>
          <Button bsStyle="success" onClick={this.onBambooClick.bind(this, name)}>{name}</Button>
        </span>
      );
    });
  }
}
