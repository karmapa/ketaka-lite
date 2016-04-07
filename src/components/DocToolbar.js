import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';

export default class ImageZoomerToolbar extends React.Component {

  static PropTypes = {
    inputValue: PropTypes.string,
    onArrowLeftButtonClick: PropTypes.func,
    onArrowRightButtonClick: PropTypes.func,
    onInputBlur: PropTypes.func,
    onInputChange: PropTypes.func,
    onInputKeyDown: PropTypes.func
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {

    let {inputValue, onArrowLeftButtonClick, onArrowRightButtonClick, onInputBlur,
      onInputChange, onInputKeyDown} = this.props;

    return (
      <div className="section-doc">
        <button className="button-arrow-left" onClick={onArrowLeftButtonClick}>
          <i className="glyphicon glyphicon-menu-left"></i>
        </button>
        <input className="input" type="text" onChange={onInputChange}
               onBlur={onInputBlur} onKeyDown={onInputKeyDown} value={inputValue} />
        <button className="button-arrow-right" onClick={onArrowRightButtonClick}>
          <i className="glyphicon glyphicon-menu-right"></i>
        </button>
      </div>
    );
  }
}
