import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';

export default class ImageZoomerToolbar extends React.Component {

  static PropTypes = {
    className: PropTypes.string,
    inputValue: PropTypes.number,
    onAddButtonClick: PropTypes.func,
    onInputBlur: PropTypes.func,
    onInputChange: PropTypes.func,
    onInputKeyDown: PropTypes.func,
    onMinusButtonClick: PropTypes.func
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    const {inputValue, onAddButtonClick, onInputBlur, onInputChange, onInputKeyDown, onMinusButtonClick} = this.props;
    return (
      <div className={this.props.className}>
        <button className="button-minus" onClick={onMinusButtonClick}>
          <i className="glyphicon glyphicon-minus"></i>
        </button>
        <input className="input" type="text" onChange={onInputChange}
               onBlur={onInputBlur} onKeyDown={onInputKeyDown} value={inputValue} />
        <button className="button-add" onClick={onAddButtonClick}>
          <i className="glyphicon glyphicon-plus"></i>
        </button>
      </div>
    );
  }
}
