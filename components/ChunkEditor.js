import {Helper, Ime} from '../services';
import React, {PropTypes} from 'react';
import ReactList from 'react-list';
import _ from 'lodash';
import classNames from 'classnames';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, Row, Col, Input} from 'react-bootstrap';
import {MAP_INPUT_METHODS, CHUNK_SIZE} from '../constants/AppConstants';
import {ModalConfirm} from '.';

export default class ChunkEditor extends React.Component {

  static PropTypes = {
    hidden: PropTypes.bool.isRequire,
    className: PropTypes.string,
    apply: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    chunk: PropTypes.string.isRequired,
    inputMethod: PropTypes.string.isRequired
  };

  state = {
    chunks: [],
    chunkIndex: null,
    valueEndsWith: '',
    valueStartsWith: ''
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  componentDidMount() {
    this.ime = Ime;
    this.ime.setInputMethod(MAP_INPUT_METHODS[this.props.inputMethod]);
  }

  componentWillReceiveProps(nextProps) {
    // when button apply chunks clicked
    if ((true === this.props.hidden) && (false === nextProps.hidden)) {
      this.handleChunks();
    }
  }

  onKeyPress(ref, e) {
    let searchInput = React.findDOMNode(this.refs[ref]);
    let keywords = this.ime.keypress(e, {element: searchInput});
    if (_.isString(keywords)) {
      let prop = ('inputStartsWith' === ref) ? 'valueStartsWith' : 'valueEndsWith';
      this.setState({
        [prop]: keywords
      });
    }
  }

  onKeyDown(e) {
    this.ime.keydown(e);
  }

  onKeyUp(e) {
    this.ime.keyup(e);
  }

  onInputStartsWithChange(e) {
    this.setState({
      valueStartsWith: e.target.value
    });
  }

  onInputEndsWithChange(e) {
    this.setState({
      valueEndsWith: e.target.value
    });
  }

  componentDidUpdate(previousProps, previousState) {
    let state = this.state;

    if ((state.valueStartsWith !== previousState.valueStartsWith) || (state.valueEndsWith !== previousState.valueEndsWith)) {
      this.handleChunks();
    }
  }

  handleChunks() {
    let {chunk} = this.props;
    let {valueStartsWith, valueEndsWith} = this.state;

    // both empty
    if (('' === valueStartsWith) && ('' === valueEndsWith) && chunk) {
      this.setState({
        chunks: Helper.chunkString(chunk, CHUNK_SIZE)
      });
    }
    else if (valueStartsWith && ('' === valueEndsWith)) {   // has valueStartsWith

      let chunks =  Helper.allIndexOf(chunk, valueStartsWith)
        .map(index => chunk.substring(index));

      if (chunks.length > 0) {
        this.setState({chunks});
      }
    }
    else if (('' === valueStartsWith) && valueEndsWith) {    // has valueEndsWith

      let chunks =  Helper.allIndexOf(chunk, valueEndsWith)
        .map(index => {
          let end = index + valueEndsWith.length;
          return chunk.substring(end - CHUNK_SIZE, end);
        });

      if (chunks.length > 0) {
        this.setState({chunks});
      }
    } else if (valueStartsWith && valueEndsWith) {    // has both

      let startIndices = Helper.allIndexOf(chunk, valueStartsWith);
      let endIndices = Helper.allIndexOf(chunk, valueEndsWith);

      let chunks = _.chain(startIndices)
        .map(startIndex => {
          return endIndices.map(endIndex => chunk.substring(startIndex, endIndex + valueEndsWith.length));
        })
        .flatten()
        .sortBy(str => str.length)
        .value();

      if (chunks.length > 0) {
        this.setState({chunks});
      }
    }
  }

  canApply() {
    let {chunkIndex, chunks} = this.state;
    let chunk = chunks[chunkIndex] || '';
    return chunk.length > 0;
  }

  initState() {
    this.setState({
      chunks: [],
      chunkIndex: null,
      valueEndsWith: '',
      valueStartsWith: ''
    });
  }

  apply() {
    let {chunkIndex, chunks} = this.state;
    let chunk = chunks[chunkIndex];
    this.props.apply(chunk);
    this.initState();
    this.handleChunks();
    this.refs.modalApplyConfirm.close();
  }

  openModalApplyConfirm() {
    let {chunkIndex, chunks} = this.state;
    let chunk = chunks[chunkIndex];

    if (chunk.length > 10000) {
      this.refs.modalApplyConfirm.open({
        title: 'Oops',
        message: 'You are about to apply a large chunk. Are you sure ?'
      });
    }
    else {
      this.apply();
    }
  }

  cancelApplyChunk() {
    this.refs.modalApplyConfirm.close();
  }

  render() {
    let {cancel} = this.props;
    let {valueStartsWith, valueEndsWith, chunks} = this.state;

    let inputStartsWithProps = {
      className: 'form-control',
      onChange: ::this.onInputStartsWithChange,
      onKeyDown: ::this.onKeyDown,
      onKeyPress: this.onKeyPress.bind(this, 'inputStartsWith'),
      onKeyUp: ::this.onKeyUp,
      placeholder: 'Starts with',
      value: valueStartsWith
    };

    let inputEndsWithProps = {
      className: 'form-control',
      onChange: ::this.onInputEndsWithChange,
      onKeyDown: ::this.onKeyDown,
      onKeyPress: this.onKeyPress.bind(this, 'inputEndsWith'),
      onKeyUp: ::this.onKeyUp,
      placeholder: 'Ends with',
      value: valueEndsWith
    };

    return (
      <div className={'chunk-editor ' + this.props.className}>
        <Input wrapperClassName="wrapper">
          <Row>
            <Col xs={6}>
              <input type="text" ref="inputStartsWith" {...inputStartsWithProps} />
            </Col>
            <Col xs={6}>
              <input type="text" ref="inputEndsWith" {...inputEndsWithProps} />
            </Col>
          </Row>
        </Input>
        <div className="chunks">
          <ReactList key="chunks" itemRenderer={::this.renderChunk} length={chunks.length} type='simple' />
        </div>
        <div className="button-groups">
          <Button className="button-cancel" onClick={cancel}>Cancel</Button>
          <Button bsStyle="primary" disabled={! this.canApply()} onClick={::this.openModalApplyConfirm}>Apply</Button>
        </div>
        <ModalConfirm ref="modalApplyConfirm" confirmText="I know What I am doing" confirm={::this.apply} cancelText="Cancel" cancel={::this.cancelApplyChunk} />
      </div>
    );
  }

  onRadioChange(e) {
    this.setState({
      chunkIndex: parseInt(e.target.value, 10)
    });
  }

  addColorTag(chunk, keywords = []) {
    let newChunk = _.clone(chunk);
    keywords.forEach(keyword => {
      if (keyword) {
        newChunk = newChunk.split(keyword)
          .join('<span class="danger">' + keyword + '</span>');
      }
    });
    return newChunk;
  }

  decorateChunk(chunk, keywords = []) {
    if (chunk.length > CHUNK_SIZE) {
      let delta = 150;
      let lastKeyword = _.last(keywords);
      let start = chunk.length - lastKeyword.length - delta;
      return this.addColorTag(chunk.substring(0, CHUNK_SIZE - delta), keywords) + '......' + this.addColorTag(chunk.substring(start), keywords);
    }
    return this.addColorTag(chunk, keywords);
  }

  renderChunk(index, key) {

    let {valueStartsWith, valueEndsWith, chunks, chunkIndex} = this.state;
    let chunk = chunks[index];

    let chunkClass = {
      'chunk': true,
      'checked': index === chunkIndex
    };

    return (
      <div key={key} className={classNames(chunkClass)}>
        <label>
          <input type="radio" onChange={::this.onRadioChange} name="chunk" value={index} />
          <span className="info-chars">( {chunk.length} characters )</span>
          <p dangerouslySetInnerHTML={{__html: this.decorateChunk(chunk, [valueStartsWith, valueEndsWith])}}></p>
        </label>
      </div>
    );
  }
}
