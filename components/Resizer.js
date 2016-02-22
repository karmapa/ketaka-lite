import _ from 'lodash';
import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import shouldPureComponentUpdate from 'react-pure-render/function';
import Animator from '../services/Animator';
import {NON_EDITOR_AREA_HEIGHT, RESIZER_SIZE, DIRECTION_VERTICAL,
  DIRECTION_HORIZONTAL} from '../constants/AppConstants';
import classNames from 'classnames';

const DELTA_NS = 0.002;
const DELTA_EW = 0.0008;
const BOUNDARY_MIN = 0.005;
const BOUNDARY_MAX = 0.995;

export default class Resizer extends React.Component {

  static PropTypes = {
    direction: PropTypes.number.isRequired,
    ratio: PropTypes.number.isRequired,
    setRatio: PropTypes.func.isRequired
  };

  event = null;
  resizer = null;

  mouse = {
    x: null,
    y: null,
    isDragging: false
  }

  animator = new Animator();

  shouldComponentUpdate = shouldPureComponentUpdate;

  isMouseInit() {
    return (null === this.mouse.x) || (null === this.mouse.y);
  }

  isMovingUp(y) {
    if (this.isMouseInit()) {
      return false;
    }
    return y < this.mouse.y;
  }

  isMovingDown(y) {
    if (this.isMouseInit()) {
      return false;
    }
    return y > this.mouse.y;
  }

  isMovingLeft(x) {
    if (this.isMouseInit()) {
      return false;
    }
    return x < this.mouse.x;
  }

  isMovingRight(x) {
    if (this.isMouseInit()) {
      return false;
    }
    return x > this.mouse.x;
  }

  onResize = _.throttle(() => {
    this.forceUpdate();
  }, 300);

  handleMouseMove = () => {

    let {mouse, event} = this;
    let {ratio, setRatio, direction} = this.props;

    let x = event.clientX;
    let y = event.clientY;
    let delta = (DIRECTION_HORIZONTAL === direction) ? DELTA_NS : DELTA_EW;

    if (DIRECTION_HORIZONTAL === direction) {
      if (this.isMovingUp(y)) {
        let newRatio = ratio - ((mouse.y - y) * delta);
        setRatio((newRatio < BOUNDARY_MIN) ? BOUNDARY_MIN : newRatio, direction);
      }

      if (this.isMovingDown(y)) {
        let newRatio = ratio + (y - mouse.y) * delta;
        setRatio((newRatio > BOUNDARY_MAX) ? BOUNDARY_MAX : newRatio, direction);
      }
    }
    else {
      if (this.isMovingLeft(x)) {
        let newRatio = ratio - ((mouse.x - x) * delta);
        setRatio((newRatio < BOUNDARY_MIN) ? BOUNDARY_MIN : newRatio, direction);
      }

      if (this.isMovingRight(x)) {
        let newRatio = ratio + ((x - mouse.x) * delta);
        setRatio((newRatio > BOUNDARY_MAX) ? BOUNDARY_MAX : newRatio, direction);
      }
    }
    mouse.x = x;
    mouse.y = y;
  }

  onMouseDown = e => {
    this.event = e;
    let {mouse} = this;
    mouse.isDragging = true;
    mouse.y = e.clientY;
  };

  onMouseMove = e => {
    this.event = e;
    let {mouse, animator} = this;

    if (! this.mouse.isDragging) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      return;
    }
    if (! animator.isRunning()) {
      animator.start(this.handleMouseMove);
    }
  };

  onMouseUp = e => {
    this.event = e;
    this.mouse.isDragging = false;
    this.animator.stop();
  };

  componentDidMount() {
    this.resizer = ReactDOM.findDOMNode(this.refs.resizer);
    this.resizer.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('resize', this.onResize);
    this.props.setRatio(0.5);
  }

  componentWillUnmount() {
    this.resizer.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('resize', this.onResize);
    this.animator.stop();
  }

  getLeftTop() {
    let top, left;
    let {direction} = this.props;
    let halfResizerSize = RESIZER_SIZE / 2;

    if (DIRECTION_HORIZONTAL === direction) {
      top = NON_EDITOR_AREA_HEIGHT + ((window.innerHeight - NON_EDITOR_AREA_HEIGHT) * this.props.ratio) - halfResizerSize;
      left = 0;
    }
    else {
      top = NON_EDITOR_AREA_HEIGHT;
      left = (window.innerWidth * this.props.ratio) - halfResizerSize - 5;
    }
    return {top, left};
  }

  render() {

    let style = this.getLeftTop();
    let {direction} = this.props;
    let classes = {
      'resizer': true,
      'vertical': DIRECTION_VERTICAL === direction
    };

    return (
      <div ref="resizer" className={classNames(classes)} style={style}></div>
    );
  }
}
