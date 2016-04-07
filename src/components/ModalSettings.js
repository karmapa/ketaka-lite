import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal, Input} from 'react-bootstrap';
import {ComboListenerInput} from '.';
import _ from 'lodash';

import {DEFAULT_SHORTCUTS} from '../constants/AppConstants';
import {connect} from 'react-redux';
import {updateSettings} from '../modules/app';

@connect(state => ({
  theme: state.app.theme,
  shortcuts: state.app.shortcuts
}), {updateSettings}, null, {withRef: true})
export default class ModalSettings extends React.Component {

  static PropTypes = {
    theme: PropTypes.string.isRequired,
    shortcuts: PropTypes.object.isRequired,
    updateSettings: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired
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

  resetShortcuts = () => {
    this.props.updateSettings({shortcuts: DEFAULT_SHORTCUTS});
  }

  onThemeChange = e => {
    this.props.updateSettings({theme: e.target.value});
  }

  onDirectionChange = e => {
    this.props.updateSettings({direction: parseInt(e.target.value, 10)});
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  setShortcuts = shortcuts => {
    this.props.updateSettings({
      shortcuts: Object.assign({}, this.props.shortcuts, shortcuts)
    });
  }

  renderComboInputs = () => {
    let self = this;
    return _.map(self.props.shortcuts, (shortcut, prop) => {
      return (
        <li key={prop}>
          <span className="combo-text">{shortcut.text}</span>
          <ComboListenerInput className="combo-listener" prop={prop} shortcut={shortcut} setShortcuts={self.setShortcuts} />
        </li>
      );
    });
  };

  render() {
    let {theme} = this.props;
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
              <Input type="radio" label="Default" onChange={this.onThemeChange} checked={'default' === theme} value="default" />
              <Input type="radio" label="Zenburn" onChange={this.onThemeChange} checked={'zenburn' === theme} value="zenburn" />
            </div>
            <label>Keyboard Shortcuts</label>
            <ul>
              {this.renderComboInputs()}
              <li>
                <Button onClick={this.resetShortcuts}>Reset Shortcuts to Default</Button>
              </li>
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
