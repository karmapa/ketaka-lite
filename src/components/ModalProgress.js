import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Alert, Button, Modal, ProgressBar} from 'react-bootstrap';
import {connect} from 'react-redux';
import {isArray, isFunction, groupBy, map} from 'lodash';
import {initModal, openModal, closeModal, addMessages, setOptions, setMessages} from '../modules/modalProgress';

@connect(state => ({
  firstButtonStyle: state.modalProgress.firstButtonStyle,
  firstButtonText: state.modalProgress.firstButtonText,
  isModalVisible: state.modalProgress.isModalVisible,
  messages: state.modalProgress.messages,
  progress: state.modalProgress.progress,
  progressBarActive: state.modalProgress.progressBarActive,
  progressBarStyle: state.modalProgress.progressBarStyle,
  secondButtonStyle: state.modalProgress.secondButtonStyle,
  secondButtonText: state.modalProgress.secondButtonText,
  showFirstButton: state.modalProgress.showFirstButton,
  showSecondButton: state.modalProgress.showSecondButton,
  title: state.modalProgress.title
}), {initModal, openModal, closeModal, addMessages, setOptions, setMessages}, null, {withRef: true})
export default class ModalProgress extends React.Component {

  static propTypes = {
    addMessages: PropTypes.func.isRequired,
    closeModal: PropTypes.func.isRequired,
    firstButtonStyle: PropTypes.string.isRequired,
    firstButtonText: PropTypes.string.isRequired,
    initModal: PropTypes.func.isRequired,
    isModalVisible: PropTypes.bool.isRequired,
    messages: PropTypes.array.isRequired,
    openModal: PropTypes.func.isRequired,
    progress: PropTypes.number.isRequired,
    progressBarActive: PropTypes.bool.isRequired,
    progressBarStyle: PropTypes.string.isRequired,
    secondButtonStyle: PropTypes.string.isRequired,
    secondButtonText: PropTypes.string.isRequired,
    setMessages: PropTypes.func.isRequired,
    setOptions: PropTypes.func.isRequired,
    showFirstButton: PropTypes.bool.isRequired,
    showSecondButton: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired
  };

  handleFirstButtonClick = () => this.close();

  handleSecondButtonClick = () => this.close();

  initModal = () => {
    this.handleFirstButtonClick = () => this.close();
    this.handleSecondButtonClick = () => this.close();
    this.props.initModal();
  };

  open = args => this.props.openModal(args);

  close = () => {
    this.props.closeModal();
    this.initModal();
  };

  setProgress = progress => {
    this.props.setOptions({progress});
    return this;
  };

  setOptions = (options = {}) => {
    if (isFunction(options.handleFirstButtonClick)) {
      this.handleFirstButtonClick = options.handleFirstButtonClick;
    }
    if (isFunction(options.handleSecondButtonClick)) {
      this.handleSecondButtonClick = options.handleSecondButtonClick;
    }
    this.props.setOptions(options);
    return this;
  };

  addMessages(messages) {
    if (! isArray(messages)) {
      messages = [messages];
    }
    this.props.addMessages(messages);
    return this;
  }

  setMessages(messages) {
    if (! isArray(messages)) {
      messages = [messages];
    }
    this.props.setMessages(messages);
    return this;
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {

    const {className, isModalVisible, progressBarStyle, progressBarActive, progress,
      firstButtonText, secondButtonText, messages, firstButtonStyle,
      secondButtonStyle, showSecondButton, showFirstButton} = this.props;

    const firstButtonProps = {
      onClick: this.handleFirstButtonClick
    };

    const secondButtonProps = {
      onClick: this.handleSecondButtonClick
    };

    if (firstButtonStyle) {
      firstButtonProps.bsStyle = firstButtonStyle;
    }
    if (secondButtonStyle) {
      secondButtonProps.bsStyle = secondButtonStyle;
    }

    return (
      <Modal show={isModalVisible} className={className}>
        <Modal.Header>
          <Modal.Title>{this.props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProgressBar active={progressBarActive} bsStyle={progressBarStyle} now={progress} />
          {this.renderMessages(messages)}
        </Modal.Body>
        <Modal.Footer>
          {showFirstButton && <Button {...firstButtonProps}>{firstButtonText}</Button>}
          {showSecondButton && <Button {...secondButtonProps}>{secondButtonText}</Button>}
        </Modal.Footer>
      </Modal>
    );
  }

  renderMessages(messages) {
    return map(
      groupBy(messages, 'type'),
      (rows, type) => (<Alert key={type} bsStyle={type}>{this.renderRows(rows)}</Alert>)
    );
  }

  renderRows(rows) {
    return rows.map((row, index) => {
      return row.message.split('\n')
        .map((message, subIndex) => (<p key={row.type + index + ':' + subIndex}>{message}</p>));
    });
  }
}
