import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';

export default class ImageZoomer extends React.Component {

  static PropTypes = {
    onClick: PropTypes.func.isRequired
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    return <span onClick={this.props.onClick} className="image-zoomer-button-close">×</span>;
  }
}
