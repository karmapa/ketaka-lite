import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import {ImeTextarea} from '../components';
import {isEqual} from 'lodash';
import {connect} from 'react-redux';
import {setExceptionWords} from '../modules/app';

@connect(state => ({
  words: state.app.exceptionWords
}), {setExceptionWords}, null, {withRef: true})
export default class ModalSpellCheckExceptionList extends React.Component {

  static PropTypes = {
    setExceptionWords: PropTypes.func.isRequired,
    words: PropTypes.array.isRequired
  };

  componentWillReceiveProps(nextProps) {
    if (! isEqual(this.props.words, nextProps.words)) {
      this.setState({
        textareaValue: nextProps.words.join(',')
      });
    }
  }

  state = {
    show: false,
    textareaValue: ''
  };

  open = () => {
    this.setState({
      show: true
    });
  }

  close = () => {
    this.setState({
      show: false
    });
  }

  save = () => {
    this.props.setExceptionWords(this.state.textareaValue.split(','));
    this.close();
  };

  onModalHide() {
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  onKeyPress = textareaValue => {
    this.setState({
      textareaValue
    });
  }

  onChange = e => {
    this.setState({
      textareaValue: e.target.value
    });
  }

  onFormSubmit = e => {
    e.preventDefault();
    this.props.addExceptionWord(this.state.textareaValue);
    this.setState({
      textareaValue: ''
    });
  }

  render() {

    const {show, textareaValue} = this.state;
    const textareaProps = {
      className: 'form-control',
      type: 'text',
      onChange: this.onChange,
      onKeyPress: this.onKeyPress,
      value: textareaValue
    };

    return (
      <Modal show={show} onHide={this.onModalHide}>
        <Modal.Header>
          <Modal.Title>
            <div>
              <span>SpellCheck Exception List</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="modal-exception-list">
            <form name="exceptionForm" onSubmit={this.onFormSubmit}>
              <ImeTextarea {...textareaProps} />
            </form>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
          <Button onClick={this.save}>Save</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
