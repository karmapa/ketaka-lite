import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {KEY_ENTER} from '../constants/AppConstants';

export default class PageSwitch extends React.Component {

  static PropTypes = {
    pageIndex: PropTypes.number,
    pageNames: PropTypes.array,
    onInputChange: PropTypes.func
  };

  state = {
    inputValue: this.props.pageNames[this.props.pageIndex]
  };

  hasPrevious() {
    return !! this.props.pageNames[this.props.pageIndex - 1];
  }

  hasNext() {
    return !! this.props.pageNames[this.props.pageIndex + 1];
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      inputValue: nextProps.pageNames[nextProps.pageIndex]
    });
  }

  onInputChange(e) {
    this.setState({
      inputValue: e.target.value
    });
  }

  hasInputName(name) {
    return this.props.pageNames.includes(name);
  }

  checkInput(name) {

    let {pageIndex, pageNames, onInputChange} = this.props;

    if (this.hasInputName(name)) {
      onInputChange(pageNames.indexOf(name));
    }
    else {
      this.setState({
        inputValue: pageNames[pageIndex]
      });
    }
  }

  onInputKeyDown(e) {
    let keyCode = e.keyCode || e.which;

    if (KEY_ENTER === keyCode) {
      this.checkInput(e.target.value);
    }
  }

  onInputBlur(e) {
    this.checkInput(e.target.value);
  }

  previous() {
    if (this.hasPrevious()) {
      this.props.onInputChange(this.props.pageIndex - 1);
    }
  }

  next() {
    if (this.hasNext()) {
      this.props.onInputChange(this.props.pageIndex + 1);
    }
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  componentWillUpdate(nextProps) {
    let {pageIndex} = this.props;
    if (pageIndex !== nextProps.pageIndex) {
      this.setState({
        inputValue: this.props.pageNames[nextProps.pageIndex]
      });
    }
  }

  render() {
    return (
      <div className={this.props.className}>
        <button className="button-arrow-left" disabled={! ::this.hasPrevious()} onClick={::this.previous}>
          <i className="glyphicon glyphicon-menu-left"></i>
        </button>
        <input className="input" type="text" value={this.state.inputValue}
            onChange={::this.onInputChange} onKeyDown={::this.onInputKeyDown} onBlur={::this.onInputBlur} />
        <button className="button-arrow-right" disabled={! ::this.hasNext()} onClick={::this.next}>
          <i className="glyphicon glyphicon-menu-right"></i>
        </button>
      </div>
    );
  }
}
