import React, { PropTypes } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal, Input} from 'react-bootstrap';
import {ComboListenerInput} from '.';

import {DIRECTION_HORIZONTAL, DIRECTION_VERTICAL} from '../constants/AppConstants';

export default class ModalSettings extends React.Component {

  static PropTypes = {
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

  close = () => {
    this.setState({
      show: false
    });
  }

  onModalHide() {
  }

  onThemeChange = e => {
    this.props.updateSettings({theme: e.target.value});
  }

  onDirectionChange = e => {
    this.props.updateSettings({direction: parseInt(e.target.value, 10)});
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    let {settings} = this.props;
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
              <Input type='radio' label='Default' onChange={this.onThemeChange} checked={'default' === theme} value="default" />
              <Input type='radio' label='Zenburn' onChange={this.onThemeChange} checked={'zenburn' === theme} value="zenburn" />
            </div>
            <div className="direction">
              <Input type='radio' label='Horizontal' onChange={this.onDirectionChange} checked={DIRECTION_HORIZONTAL === direction} value={DIRECTION_HORIZONTAL} />
              <Input type='radio' label='Vertical' onChange={this.onDirectionChange} checked={DIRECTION_VERTICAL === direction} value={DIRECTION_VERTICAL} />
            </div>
            <label>Keyboard Shortcuts</label>
            <ul>
              <li>
                <span className="combo-text">Add a new tab</span>
                <ComboListenerInput className="combo-listener" value="cmd + j" />
              </li>
              <li>
                <span className="combo-text">Close current tab</span>
                <ComboListenerInput className="combo-listener" value="cmd + k" />
              </li>
              <li>
                <span className="combo-text">Switch to the previous tab</span>
                <ComboListenerInput className="combo-listener" value="ctrl + alt + left" />
              </li>
              <li>
                <span className="combo-text">Switch to the next tab</span>
                <ComboListenerInput className="combo-listener" value="ctrl + alt + right" />
              </li>
              <li>
                <span className="combo-text">Save the current bamboo</span>
                <ComboListenerInput className="combo-listener" value="ctrl + s" />
              </li>
              <li>
                <span className="combo-text">Switch input method</span>
                <ComboListenerInput className="combo-listener" value="alt + space" />
              </li>
              <li>
                <span className="combo-text">Find</span>
                <ComboListenerInput className="combo-listener" value="ctrl + f" />
              </li>
              <li>
                <span className="combo-text">Find Next</span>
                <ComboListenerInput className="combo-listener" value="enter" />
              </li>
              <li>
                <span className="combo-text">Find Previous</span>
                <ComboListenerInput className="combo-listener" value="shift + enter" />
              </li>
              <li>
                <span className="combo-text">Replace</span>
                <ComboListenerInput className="combo-listener" value="shift + ctrl + f" />
              </li>
              <li>
                <span className="combo-text">Confirm Replace</span>
                <ComboListenerInput className="combo-listener" value="y" />
              </li>
              <li>
                <span className="combo-text">Confirm Reject</span>
                <ComboListenerInput className="combo-listener" value="n" />
              </li>
              <li>
                <span className="combo-text">Stop</span>
                <ComboListenerInput className="combo-listener" value="esc" />
              </li>
              <li>
                <span className="combo-text">Replace All</span>
                <ComboListenerInput className="combo-listener" value="shift + enter" />
              </li>
              <li>
                <span className="combo-text">Split Page</span>
                <ComboListenerInput className="combo-listener" value="ctrl + enter" />
              </li>
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
