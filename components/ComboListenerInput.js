import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {keyCode} from '../services';

export default class ComboListenerInput extends React.Component {

  static PropTypes = {
    className: PropTypes.string,
    value: PropTypes.string
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      text: this.props.value
    };
  }

  keyCodes = [];

  shouldComponentUpdate = shouldPureComponentUpdate;

  getKeyNameByKeyCode(code) {
    return keyCode(code);
  }

  keyCodesToText = () => {
    return this.keyCodes.map(this.getKeyNameByKeyCode)
      .join(' + ');
  }

  onChange = () => {}

  onKeyDown = e => {

     e.stopPropagation();
     e.preventDefault();

    if ('backspace' === keyCode(e.keyCode)) {
      this.keyCodes.length = 0;
      this.setState({
        text: ''
      });
      return;
    }

    let keyCodes = this.keyCodes;
    if (! keyCodes.includes(e.keyCode)) {
      keyCodes.push(e.keyCode);
    }
    this.setState({
      text: this.keyCodesToText()
    });
  }

  shouldComponentUpdate = shouldPureComponentUpdate

  render() {

    let props = {
      className: this.props.className,
      onChange: this.onChange,
      onKeyDown: this.onKeyDown,
      type: 'text',
      value: this.state.text
    };

    return (
      <input {...props} />
    );
  }
}
