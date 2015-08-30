import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import {MAP_INPUT_METHODS} from '../constants/AppConstants';
import classNames from 'classnames';
import Ime from '../services/Ime';
import _ from 'lodash';

export default class ModalChunksApply extends React.Component {

  static PropTypes = {
    cancel: PropTypes.func.isRequired,
    confirm: PropTypes.func.isRequired,
    inputMethod: PropTypes.string.isRequired
  }

  pageNames = [];

  state = {
    show: false,
    loading: false,
    chunks: [],
    keywords: ''
  };

  open(args) {
    let state = {
      show: true,
      chunks: args.chunks,
    };
    args.chunks.forEach((chunk, index) => {
      let prop = this.getChunkKey(index);
      state[prop] = false;
    });
    this.setState(state);
  }

  close() {
    this.setState({
      show: false,
      loading: false,
      keywords: ''
    });
  }

  onModalHide() {
  }

  onKeywordChange(e) {
    this.setState({
      keywords: e.target.value
    });
  }

  onCheckboxChange(field, e) {
    let nextState = {};
    nextState[field] = e.target.checked;
    this.setState(nextState);
  }

  getChunkKey(index) {
    return 'chunk:' + index;
  }

  confirm() {
    let selectedChunks = this.state.chunks.filter((chunk, index) => {
      let key = this.getChunkKey(index);
      return this.state[key];
    });

    if (selectedChunks.length > 0) {
      this.setState({
        loading: true
      });
      this.props.confirm(selectedChunks);
    }
  }

  onInputBlur() {
    this.setState({
      dirty: true
    });
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  componentDidMount() {
    this.ime = Ime;
    this.ime.setInputMethod(MAP_INPUT_METHODS[this.props.inputMethod]);
  }

  onChange(e) {
    this.setState({
      keywords: e.target.value
    });
  }

  onKeyPress(e) {
    let searchInput = React.findDOMNode(this.refs.searchInput);
    let keywords = this.ime.keypress(e, {element: searchInput});
    if (_.isString(keywords)) {
      this.setState({
        keywords
      });
    }
  }

  onKeyDown(e) {
    this.ime.keydown(e);
  }

  onKeyUp(e) {
    this.ime.keyup(e);
  }

  render() {
    let {cancel} = this.props;
    let {show, chunks, keywords, loading} = this.state;

    return (
      <Modal bsSize="large" show={show} onHide={this.onModalHide}>
        <Modal.Header>
          <Modal.Title>Apply Chunks Based On RTF File Content</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="modal-chunks-apply">

            <div className="form-group group-class has-feedback">
              <label className="control-label">
                <span>Search Keywords</span>
              </label>
              <input className="form-control" type="text" value={keywords} placeholder="Enter Text" ref="searchInput"
                     onChange={::this.onChange} onKeyPress={::this.onKeyPress} onKeyDown={::this.onKeyDown} onKeyUp={::this.onKeyUp} />
            </div>
            <ul>
              {this.renderChunks(chunks, keywords)}
            </ul>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={cancel}>Cancel</Button>
          <Button bsStyle="primary" onClick={::this.confirm} disabled={loading}>Apply Chunks</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  renderChunks(chunks, keywords) {

    let keywordsLength = keywords.length;

    return chunks.map((chunk, index) => {

      let matchedIndex = chunk.indexOf(keywords);

      return {
        key: this.getChunkKey(index),
        matched: -1 !== matchedIndex,
        matchedIndex: matchedIndex,
        chunk: chunk
      };
    })
    .filter(row => {
      return row.matched || this.state[row.key];
    })
    .sort(row => {
      // if keywords present, put matched items on the bottom
      return row.matched ? 0 : 1;
    })
    .map(row => {

      row.tinyChunk = row.chunk.substring(row.matchedIndex, row.matchedIndex + 350);

      if (keywordsLength > 0) {
        row.tinyChunk = row.tinyChunk.replace(new RegExp(keywords, 'g'), '<span class="danger">' + keywords + '</span>');
      }

      let key = row.key;
      let classnames = {
        selected: this.state[key]
      };

      return (
        <li className={classNames(classnames)} key={'li.' + row.key}>
          <label>
            <input type="checkbox" onChange={this.onCheckboxChange.bind(this, key)} checked={this.state[key]} />
            <p dangerouslySetInnerHTML={{__html: row.tinyChunk}}></p>
          </label>
        </li>
      );
    });
  }
}
