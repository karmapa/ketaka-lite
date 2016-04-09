import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import {isString} from 'lodash';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Ime} from '../services';

export default class ImeInput extends React.Component {

  static PropTypes = {
    className: PropTypes.string,
    inputMethod: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    onKeyDown: PropTypes.func,
    onKeyPress: PropTypes.func,
    onKeyUp: PropTypes.func,
    value: PropTypes.string
  };

  static defaultProps = {
    className: '',
    onChange: () => {},
    onKeyDown: () => {},
    onKeyPress: () => {},
    onKeyUp: () => {},
    value: ''
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  onChange = e => this.props.onChange(e);

  onKeyDown = e => {
    Ime.keydown(e);
    this.props.onKeyDown(e);
  };

  onKeyUp = e => {
    Ime.keyup(e);
    this.props.onKeyUp(e);
  };

  onKeyPress = e => {
    const value = Ime.keypress(e, {element: this.input});
    if (isString(value)) {
      this.props.onKeyPress(value);
    }
  };

  focus() {
    this.input.focus();
  }

  render() {

    const inputProps = {
      className: this.props.className,
      onChange: this.onChange,
      onKeyDown: this.onKeyDown,
      onKeyPress: this.onKeyPress,
      onKeyUp: this.onKeyUp,
      ref: ref => {
        this.input = ReactDOM.findDOMNode(ref);
      },
      type: 'text',
      value: this.props.value
    };
    return <input {...inputProps} />;
  }
}
