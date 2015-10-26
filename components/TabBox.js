import React, {PropTypes, cloneElement} from 'react';
import classNames from 'classnames';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Nav, NavItem, utils} from 'react-bootstrap';

let panelId = (props, child) => child.props.id ? child.props.id : props.id && (props.id + '___panel___' + child.props.eventKey);
let tabId = (props, child) => child.props.id ? child.props.id + '___tab' : props.id && (props.id + '___tab___' + child.props.eventKey);

export default class TabBox extends React.Component {

  static PropTypes = {
    activeKey: PropTypes.any,
    bsStyle: PropTypes.oneOf(['tabs', 'pills']),
    onClose: PropTypes.func,
    onSelect: PropTypes.func
  };

  static defaultProps = {
    bsStyle: 'tabs'
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    let {id, activeKey, ...props} = this.props;
    return (
      <div>
        <Nav {...props} activeKey={activeKey} onSelect={this.props.onSelect}>
          {utils.ValidComponentChildren.map(this.props.children, this.renderTab, this)}
        </Nav>
        <div id={id} className="tab-content">
          {utils.ValidComponentChildren.map(this.props.children, this.renderPane)}
        </div>
      </div>
    );
  }

  renderTab = child => {
    let {eventKey, className, tab, disabled, noCloseButton} = child.props;
    let {onClose} = this.props;
    let classes = {
      'close': true,
      'hidden': noCloseButton
    };
    return (
      <NavItem linkId={tabId(this.props, child)} ref={'tab' + eventKey}
         aria-controls={panelId(this.props, child)} eventKey={eventKey}
         className={className} disabled={disabled}>
        {tab}
        <span className={classNames(classes)} onClick={onClose.bind(null, child.props)}>&times;</span>
      </NavItem>
    );
  }

  renderPane = (child, index) => {

    let activeKey = this.props.activeKey;
    let active = (child.props.eventKey === activeKey);

    return cloneElement(child, {
      active,
      id: panelId(this.props, child),
      'aria-labelledby': tabId(this.props, child),
      key: child.key ? child.key : index
    });
  }
}
