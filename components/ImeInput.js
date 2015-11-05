import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Ime} from '../services';
import {MAP_INPUT_METHODS} from '../constants/AppConstants';
import _ from 'lodash';

export default class SearchBar extends React.Component {

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

  componentDidMount() {
    this.ime = Ime;
    this.ime.setInputMethod(MAP_INPUT_METHODS[this.props.inputMethod]);
  }

  onChange = e => {
    this.props.onChange(e);
  }

  onKeyDown = e => {
    this.ime.keydown(e);
    this.props.onKeyDown(e);
  }

  onKeyUp = e => {
    this.ime.keyup(e);
    this.props.onKeyUp(e);
  }

  onKeyPress = e => {
    let value = this.ime.keypress(e, {element: this.input});
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
        this.input = React.findDOMNode(ref);
      },
      type: 'text',
      value: this.props.value
    };
    return <input {...inputProps} />;
  }
}
