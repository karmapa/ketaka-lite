import React, { PropTypes } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal, Input} from 'react-bootstrap';

import {DIRECTION_HORIZONTAL, DIRECTION_VERTICAL} from '../constants/AppConstants';

export default class ModalSettings extends React.Component {

  static PropTypes = {
    cancel: PropTypes.func.isRequired,
    updateSettings: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired
  };

  state = {
    show: false
  };

  open() {
    this.setState({
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
    this.props.updateSettings({theme: e.target.value});
  }

  onDirectionChange(e) {
    this.props.updateSettings({direction: parseInt(e.target.value, 10)});
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    let {cancel, settings} = this.props;
    let {direction, theme} = settings;
    let {show} = this.state;

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
            <div className="direction">
              <Input type='radio' label='Horizontal' onChange={::this.onDirectionChange} checked={DIRECTION_HORIZONTAL === direction} value={DIRECTION_HORIZONTAL} />
              <Input type='radio' label='Vertical' onChange={::this.onDirectionChange} checked={DIRECTION_VERTICAL === direction} value={DIRECTION_VERTICAL} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={::this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
