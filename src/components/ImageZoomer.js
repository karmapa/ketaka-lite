import {Animator} from '../services/';
import ImageZoomerToolbar from './ImageZoomerToolbar';
import ImageZoomerCloseButton from './ImageZoomerCloseButton';
import React, {PropTypes, Component} from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import shouldPureComponentUpdate from 'react-pure-render/function';
import Path from 'path';

export default class ImageZoomer extends Component {

  static PropTypes = {
    style: PropTypes.prop,
    direction: PropTypes.bool.isRequired,
    movingSpeed: PropTypes.number,
    pageName: PropTypes.string.isRequired,
    onImageZoomerCloseButtonClick: PropTypes.func.isRequired,
    src: PropTypes.string.isRequired
  };

  static defaultProps = {
    deltaPercent: 25,
    movingSpeed: 1.3
  };

  state = {
    percent: 100,
    inputValue: '100%',
    translateX: 0,
    translateY: 0,
    isHolding: false,
    isDragging: false
  };

  container = {
    width: 0,
    height: 0
  }

  image = {
    width: 0,
    height: 0
  };

  mouse = {
    x: null,
    y: null,
    event: null,
    onMouseMove: null,
    onMouseUp: null
  };

  animator = new Animator();

  onResize = null;

  handleMouseMove = () => {

    const mouse = this.mouse;
    const e = mouse.event;
    const newX = e.clientX;
    const newY = e.clientY;
    let deltaX = 0;
    let deltaY = 0;
    const movingSpeed = this.props.movingSpeed;

    if (this.isOverflowX()) {
      deltaX = (newX - mouse.x) * movingSpeed;
      this.setState({
        translateX: this.state.translateX + deltaX
      });
    }
    if (this.isOverflowY()) {
      deltaY = (newY - mouse.y) * movingSpeed;
      this.setState({
        translateY: this.state.translateY + deltaY
      });
    }
    mouse.x = newX;
    mouse.y = newY;
  }

  onMouseDown = e => {
    const mouse = this.mouse;
    mouse.event = e;
    // prevent image downloading in chrome
    if (['DIV', 'IMG'].includes(e.target.tagName)) {
      e.preventDefault();
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    this.setState({
      isHolding: true
    });
  }

  onMouseMove = e => {

    const animator = this.animator;
    this.mouse.event = e;

    if (this.state.isHolding) {
      this.setState({
        isDragging: true
      });
      if (! animator.isRunning()) {
        animator.start(this.handleMouseMove);
      }
    }
  }

  isOverflowX(percent = this.state.percent) {
    const ratio = percent / 100;
    return ((this.image.width * ratio) > this.container.width);
  }

  isOverflowY(percent = this.state.percent) {
    const ratio = percent / 100;
    return ((this.image.height * ratio) > this.container.height);
  }

  onMouseUp = () => {
    this.animator.stop();
    this.setState({
      isHolding: false,
      isDragging: false
    });
  }

  enlarge = e => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    const newPercent = this.state.percent + this.props.deltaPercent;

    this.setState({
      percent: newPercent,
      inputValue: newPercent + '%'
    });
    this.adjustTranslate(newPercent);
  }

  shrink = e => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    const newPercent = this.state.percent - this.props.deltaPercent;

    if (newPercent >= 25) {
      this.setState({
        percent: newPercent,
        inputValue: newPercent + '%'
      });
      this.adjustTranslate(newPercent);
    }
  }

  handleInputChange = e => {

    const value = e.target.value;
    const parsedValue = parseFloat(value);

    this.setState({
      percent: isNaN(parsedValue) ? this.state.percent : parsedValue,
      inputValue: value
    });
    this.adjustTranslate();
  }

  adjustTranslate(percent = this.state.percent) {

    if (! this.isOverflowX(percent)) {
      this.setState({
        translateX: 0
      });
    }
    if (! this.isOverflowY(percent)) {
      this.setState({
        translateY: 0
      });
    }
  }

  handleInputBlur = () => {
    this.setPercentToInputValue();
  }

  setPercentToInputValue() {
    this.setState({
      inputValue: this.state.percent + '%'
    });
  }

  onImageLoad = () => {
    this.setOffsetSize();
  }

  onImageError(err) {
    console.error('ImageZoomer error: ', err);
  }

  setOffsetSize() {
    const domContainer = ReactDOM.findDOMNode(this.refs.imageZoomer);
    const domImage = ReactDOM.findDOMNode(this.refs.imageZoomable);
    const {container, image} = this;

    container.width = domContainer.offsetWidth;
    container.height = domContainer.offsetHeight;
    image.width = domImage.offsetWidth;
    image.height = domImage.offsetHeight;
  }

  componentDidMount() {
    const mouse = this.mouse;
    mouse.onMouseMove = this.onMouseMove;
    mouse.onMouseUp = this.onMouseUp;

    this.onResize = () => {
      this.setOffsetSize();
      this.adjustTranslate();
    };

    window.addEventListener('mousemove', mouse.onMouseMove);
    window.addEventListener('mouseup', mouse.onMouseUp);
    window.addEventListener('resize', this.onResize);
  }

  componentWillUnmount() {
    this.animator.stop();
    window.removeEventListener('mousemove', this.mouse.onMouseMove);
    window.removeEventListener('mouseup', this.mouse.onMouseUp);
    window.removeEventListener('resize', this.onResize);
  }

  shouldComponentUpdate(nextProps, nextState) {

    // reset offset size when direction changes
    if (this.props.direction !== nextProps.direction) {
      this.onResize();
    }
    return shouldPureComponentUpdate.call(this, nextProps, nextState);
  }

  render() {

    const {translateX, translateY, percent, isDragging, isHolding} = this.state;
    const {src, style, onImageZoomerCloseButtonClick} = this.props;

    const classes = {
      [this.props.className]: true,
      'holding': isHolding,
      'dragging': isDragging
    };
    return (
      <div style={style} className={classNames(classes)} onMouseDown={this.onMouseDown} ref="imageZoomer">
        <img className="image-zoomable" onError={this.onImageError} onLoad={this.onImageLoad} ref="imageZoomable"
             style={{transform: 'translate(' + translateX + 'px,' + translateY + 'px) scale(' + percent / 100 + ')'}}
             src={src} />
        <ImageZoomerToolbar className="image-zoomer-toolbar" inputValue={this.state.inputValue} onInputChange={this.handleInputChange}
                            onInputBlur={this.handleInputBlur} onAddButtonClick={this.enlarge} onMinusButtonClick={this.shrink} />
        <span className="filename">{Path.basename(src.replace(/\\/g, '/'))}</span>
        <ImageZoomerCloseButton onClick={onImageZoomerCloseButtonClick} />
      </div>
    );
  }
}
