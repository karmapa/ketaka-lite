import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Ime} from '../services';
import _ from 'lodash';

export default class ImeTextarea extends React.Component {

  static PropTypes = {
    inputMethod: PropTypes.string.isRequired,
    className: PropTypes.string,
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

  onChange = e => {
    this.props.onChange(e);
  }

  onKeyDown = e => {
    Ime.keydown(e);
    this.props.onKeyDown(e);
  }

  onKeyUp = e => {
    Ime.keyup(e);
    this.props.onKeyUp(e);
  }

  onKeyPress = e => {
    let value = Ime.keypress(e, {element: this.input});
    if (_.isString(value)) {
      this.props.onKeyPress(value);
    }
  }

  focus() {
    this.input.focus();
  }

  render() {

    let inputProps = {
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
    return <textarea {...inputProps} />;
  }
}
