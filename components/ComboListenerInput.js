import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {keyCode} from '../services';

export default class ComboListenerInput extends React.Component {

  static PropTypes = {
    className: PropTypes.string,
    shortcut: PropTypes.object.isRequired,
    prop: PropTypes.string.isRequired,
    setShortcuts: PropTypes.func.isRequired
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

    let {prop, setShortcuts, shortcut} = this.props;
    let text = shortcut.text;

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

    let keyCodes = this.keyCodes;
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

    let {className, shortcut} = this.props;

    let props = {
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
