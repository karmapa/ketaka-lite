import React, { PropTypes } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';

export default class ModalSpellCheckExceptionList extends React.Component {

  static PropTypes = {
    words: PropTypes.array.isRequired,
    addExceptionWord: PropTypes.func.isRequired
  };

  state = {
    show: false
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

  onModalHide() {
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  onInputChange = e => {
    this.setState({
      inputValue: e.target.value
    });
  }

  onFormSubmit = e => {
    e.preventDefault();
    this.props.addExceptionWord(this.state.inputValue);
    this.setState({
      inputValue: ''
    });
  }

  render() {

    let {show, inputValue} = this.state;

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
            <div>
              <form name="exceptionForm" onSubmit={this.onFormSubmit}>
                <div className="input-group">
                  <input className="form-control" type="text" onChange={this.onInputChange} value={inputValue} />
                  <span className="input-group-btn">
                    <button className="btn btn-default" type="submit">Add Exception</button>
                  </span>
                </div>
              </form>
            </div>
            <div>
              {this.renderWords()}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  renderWords() {
    return this.props.words.map(word => {
      return <span className="label label-info">{word}</span>;
    });
  }
}
