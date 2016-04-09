import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {keyCode} from '../services';

export default class ComboListenerInput extends React.Component {

  static PropTypes = {
    className: PropTypes.string,
    prop: PropTypes.string.isRequired,
    setShortcuts: PropTypes.func.isRequired,
    shortcut: PropTypes.object.isRequired
  };

  keyCodes = [];

  shouldComponentUpdate = shouldPureComponentUpdate;

  getKeyNameByKeyCode(code) {
    return keyCode(code);
  }

  keyCodesToText = () => {
    return this.keyCodes.map(this.getKeyNameByKeyCode)
      .join(' + ');
  };

  onChange = () => {};

  onKeyDown = e => {

    const {prop, setShortcuts, shortcut} = this.props;
    const text = shortcut.text;

    if ('backspace' === keyCode(e.keyCode)) {
      this.keyCodes.length = 0;
      setShortcuts({
        [prop]: {
          text,
          value: ''
        }
      });
      return;
    }

    const keyCodes = this.keyCodes;
    if (! keyCodes.includes(e.keyCode)) {
      keyCodes.push(e.keyCode);
    }
    setShortcuts({
     [prop]: {
       text,
       value: this.keyCodesToText()
     }
    });
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {

    const {className, shortcut} = this.props;

    const props = {
      className,
      onChange: this.onChange,
      onKeyDown: this.onKeyDown,
      type: 'text',
      value: shortcut.value
    };

    return (
      <input {...props} />
    );
  }
}
