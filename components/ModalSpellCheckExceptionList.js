import {Ime} from '../services';
import React, { PropTypes } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import {MAP_INPUT_METHODS} from '../constants/AppConstants';
import _ from 'lodash';

export default class ModalSpellCheckExceptionList extends React.Component {

  static PropTypes = {
    words: PropTypes.array.isRequired,
    setExceptionWords: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired
  };

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

  componentDidMount() {
    this.ime = Ime;
    this.ime.setInputMethod(MAP_INPUT_METHODS[this.props.inputMethod]);
  }

  componentWillReceiveProps(nextProps) {
    this.ime.setInputMethod(MAP_INPUT_METHODS[nextProps.settings.inputMethod]);
    this.setState({
      textareaValue: nextProps.words.join(',')
    });
  }

  onKeydown = e => {
    this.ime.keydown(e);
  };

  onKeyUp = e => {
    this.ime.keyup(e);
  }

  onKeyPress = e => {
    let textarea = React.findDOMNode(this.refs.textarea);
    let textareaValue = this.ime.keypress(e, {element: textarea});

    if (_.isString(textareaValue)) {
      this.setState({
        textareaValue
      });
    }
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

    let {show, textareaValue} = this.state;
    let textareaProps = {
      ref: 'textarea',
      className: 'form-control',
      type: 'text',
      onChange: this.onChange,
      onKeydown: this.onKeydown,
      onKeyUp: this.onKeyUp,
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
              <textarea {...textareaProps} />
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
