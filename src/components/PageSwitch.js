import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {KEY_ENTER} from '../constants/AppConstants';

export default class PageSwitch extends React.Component {

  static PropTypes = {
    onInputChange: PropTypes.func,
    pageIndex: PropTypes.number,
    pageNames: PropTypes.array
  };

  state = {
    inputValue: this.props.pageNames[this.props.pageIndex]
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  componentWillUpdate(nextProps) {
    let {pageIndex, pageNames} = this.props;
    if ((pageIndex !== nextProps.pageIndex) || (pageNames.length !== nextProps.pageNames.length)) {
      this.setState({
        inputValue: nextProps.pageNames[nextProps.pageIndex]
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      inputValue: nextProps.pageNames[nextProps.pageIndex]
    });
  }

  isFirst = () => {
    return 0 === this.props.pageIndex;
  };

  isLast= () => {
    return this.props.pageIndex === (this.props.pageNames.length - 1);
  };

  hasPrevious = () => {
    return !! this.props.pageNames[this.props.pageIndex - 1];
  };

  hasNext = () => {
    return !! this.props.pageNames[this.props.pageIndex + 1];
  };

  onInputChange = e => {
    this.setState({
      inputValue: e.target.value
    });
  };

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

  onInputKeyDown = e => {
    let keyCode = e.keyCode || e.which;

    if (KEY_ENTER === keyCode) {
      this.checkInput(e.target.value);
    }
  };

  onInputBlur = e => {
    this.checkInput(e.target.value);
  };

  previous = () => {
    if (this.hasPrevious()) {
      this.props.onInputChange(this.props.pageIndex - 1);
    }
  };

  next = () => {
    if (this.hasNext()) {
      this.props.onInputChange(this.props.pageIndex + 1);
    }
  };

  toFirst = () => {
    this.props.onInputChange(0);
  };

  toLast = () => {
    this.props.onInputChange(this.props.pageNames.length - 1);
  };

  render() {
    return (
      <div className={this.props.className}>
        <button className="button-first" disabled={this.isFirst()} onClick={this.toFirst}>
          <i className="glyphicon glyphicon-backward"></i>
        </button>
        <button className="button-arrow-left" disabled={! this.hasPrevious()} onClick={this.previous}>
          <i className="glyphicon glyphicon-menu-left"></i>
        </button>
        <input className="input" type="text" value={this.state.inputValue}
            onChange={this.onInputChange} onKeyDown={this.onInputKeyDown} onBlur={this.onInputBlur} />
        <button className="button-arrow-right" disabled={! this.hasNext()} onClick={this.next}>
          <i className="glyphicon glyphicon-menu-right"></i>
        </button>
        <button className="button-last" disabled={this.isLast()} onClick={this.toLast}>
          <i className="glyphicon glyphicon-forward"></i>
        </button>
      </div>
    );
  }
}
