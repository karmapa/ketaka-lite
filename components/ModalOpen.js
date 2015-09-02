import React, { PropTypes } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import _ from 'lodash';

export default class ModalConfirm extends React.Component {

  static PropTypes = {
    onBambooClick: PropTypes.func.isRequired
  };

  state = {
    show: false,
    names: []
  };

  open(args) {
    this.setState(_.extend({
      show: true,
      names: args.names
    }, args));
  }

  close() {
    this.setState({
      show: false,
      names: []
    });
  }

  onModalHide() {
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    let {show} = this.state;
    return (
      <Modal show={show} onHide={this.onModalHide}>
        <Modal.Header>
          <Modal.Title>Bamboos</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="modal-open">
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
    return names.map(name => (<Button bsStyle="success" onClick={this.props.onBambooClick.bind(this, name)}>{name}</Button>));
  }
}
