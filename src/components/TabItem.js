import React, {PropTypes} from 'react';
import classNames from 'classnames';
import shouldPureComponentUpdate from 'react-pure-render/function';

export default class TabItem extends React.Component {

  static propTypes = {
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    noCloseButton: PropTypes.bool
  }

  static defaultProps = {
    active: false,
    bsStyle: 'tabs',
    noCloseButton: false
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {

    const classes = {
      'tab-pane': true,
      'fade': true,
      'active': this.props.active,
      'in': this.props.active
    };

    return (
      <div {...this.props} role="tabpanel" aria-hidden={this.props.active}
           className={classNames(this.props.className, classes)}>
        {this.props.children}
      </div>
    );
  }
}
