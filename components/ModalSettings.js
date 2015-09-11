import React, { PropTypes } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal, Input} from 'react-bootstrap';

export default class ModalSettings extends React.Component {

  static PropTypes = {
    cancel: PropTypes.func.isRequired,
    submit: PropTypes.func.isRequired
  };

  state = {
    show: false
  };

  open(args) {
    this.setState({
      theme: args.theme,
      show: true
    });
  }

  close() {
    this.setState({
      show: false
    });
  }

  onModalHide() {
  }

  onThemeChange(e) {
    this.setState({
      theme: e.target.value
    });
  }

  submit() {
    this.props.submit({theme: this.state.theme});
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    let {cancel} = this.props;
    let {show, theme} = this.state;

    return (
      <Modal show={show} onHide={this.onModalHide}>
        <Modal.Header>
          <Modal.Title>Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="modal-settings">
            <label>Theme</label>
            <div className="themes">
              <Input type='radio' label='Default' onChange={::this.onThemeChange} checked={'default' === theme} value="default" />
              <Input type='radio' label='Zenburn' onChange={::this.onThemeChange} checked={'zenburn' === theme} value="zenburn" />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={cancel}>Cancel</Button>
          <Button bsStyle="primary" onClick={::this.submit}>Submit</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
