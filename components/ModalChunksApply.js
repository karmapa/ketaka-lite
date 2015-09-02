import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Modal} from 'react-bootstrap';
import {MAP_INPUT_METHODS} from '../constants/AppConstants';
import classNames from 'classnames';
import Ime from '../services/Ime';
import _ from 'lodash';
import ReactList from 'react-list';

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
    rows: [],
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
    this.handleChunks({chunks: args.chunks});
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
    let keywords = e.target.value;
    this.setState({keywords});
    this.handleChunks({keywords});
  }

  onKeyPress(e) {
    let searchInput = React.findDOMNode(this.refs.searchInput);
    let keywords = this.ime.keypress(e, {element: searchInput});
    if (_.isString(keywords)) {
      this.setState({
        keywords
      });
      this.handleChunks({keywords});
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
    let {show, chunks, keywords, loading, rows} = this.state;

    return (
      <Modal bsSize="large" show={show} onHide={this.onModalHide}>
        <Modal.Header>
          <Modal.Title>Apply Chunks Based On Text File Content</Modal.Title>
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
            <div className="chunks">
              <ReactList key="chunks" itemRenderer={::this.renderChunk} length={rows.length} type='simple' />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={cancel}>Cancel</Button>
          <Button bsStyle="primary" onClick={::this.confirm} disabled={loading}>Apply Chunks</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  handleChunks(options = {}) {

    let chunks = 'chunks' in options ? options.chunks : this.state.chunks;
    let keywords = 'keywords' in options ? options.keywords : this.state.keywords;

    let keywordsLength = keywords.length;

    let rows = chunks.map((chunk, index) => {

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
    .sort((a, b) => {
      // if keywords present, put selected items on the top
      let scoreA = this.state[a.key] ? 0 : 1;
      let scoreB = this.state[b.key] ? 0 : 1;
      return scoreA - scoreB;
    })
    .map(row => {

      row.tinyChunk = row.chunk.substring(row.matchedIndex, row.matchedIndex + 350);

      if (keywordsLength > 0) {
        row.tinyChunk = row.tinyChunk.replace(new RegExp(keywords, 'g'), '<span class="danger">' + keywords + '</span>');
      }
      return row;
    });
    this.setState({rows});
  }

  renderChunk(index, key) {
    let row = this.state.rows[index];
    let classnames = {
      chunk: true,
      selected: this.state[row.key]
    };
    return (
      <div className={classNames(classnames)} key={key}>
        <label>
          <input type="checkbox" onChange={this.onCheckboxChange.bind(this, row.key)} checked={this.state[row.key]} />
          <p dangerouslySetInnerHTML={{__html: row.tinyChunk}}></p>
        </label>
      </div>
    );
  }
}
