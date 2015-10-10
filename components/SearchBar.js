import React, {PropTypes} from 'react';
import _ from 'lodash';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Ime} from '../services';
import {MAP_INPUT_METHODS} from '../constants/AppConstants';
import classNames from 'classnames';

import CodeMirror from 'codemirror';

export default class SearchBar extends React.Component {

  static PropTypes = {
    inputMethod: PropTypes.string.isRequired,
    toNextPage: PropTypes.func.isRequired,
    toPrevPage: PropTypes.func.isRequired
  };

  state = {
    keyword: '',
    opened: false
  }

  cm = null;
  cursor = null;
  shiftKeyHolding = false;

  shouldComponentUpdate = shouldPureComponentUpdate;

  saveCursor() {
    this.cursor = this.cm.getCursor();
  }

  componentDidMount() {
    this.ime = Ime;
    this.ime.setInputMethod(MAP_INPUT_METHODS[this.props.inputMethod]);
    CodeMirror.commands.find = () => {};
  }

  onChange(e) {
    let keyword = e.target.value;
    this.setState({
      keyword
    });
    this.find(keyword);
  }

  onKeyUp(e) {
    this.ime.keyup(e);

    // shift
    if (16 === e.keyCode) {
      this.shiftKeyHolding = false;
    }

    if ((13 === e.keyCode) && (! this.shiftKeyHolding)) {
      React.findDOMNode(this.refs.buttonFindNext).click();
    }

    // enter
    if ((13 === e.keyCode) && this.shiftKeyHolding) {
      React.findDOMNode(this.refs.buttonFindPrev).click();
    }
  }

  onKeyDown(e) {
    this.ime.keydown(e);

    if (16 === e.keyCode) {
      this.shiftKeyHolding = true;
    }
  }

  onKeyPress(ref, e) {

    let searchInput = React.findDOMNode(this.refs[ref]);
    let inputValue = this.ime.keypress(e, {element: searchInput});

    if (_.isString(inputValue)) {
      this.setState({
        keyword: inputValue
      });
    }
  }

  find(query = this.state.keyword) {
    let {cm} = this;
    clearSearch(cm);
    doSearch({cm, query});
  }

  findPrev() {
    doSearch({
      cm: this.cm,
      rev: true
    });
  }

  findNext() {
    doSearch({cm: this.cm});
  }

  focus() {
    let searchInput = React.findDOMNode(this.refs.searchInput);
    if (searchInput) {
      searchInput.focus();
    }
  }

  open() {
    this.setState({
      opened: true
    });
  }

  close() {
    this.setState({
      opened: false
    });
    clearSearch(this.cm);
  }

  render() {

    let classnames = {
      'box-search': true,
      'hidden': ! this.state.opened
    };

    let inputProps = {
      className: 'search-input',
      onChange: ::this.onChange,
      onKeyDown: ::this.onKeyDown,
      onKeyUp: ::this.onKeyUp,
      onKeyPress: this.onKeyPress.bind(this, 'searchInput'),
      value: this.state.keyword,
      ref: 'searchInput',
      type: 'text'
    };

    return (
      <div className={classNames(classnames)}>
        <span>Search: </span>
        <input {...inputProps} />
        <button ref="buttonFindPrev" onClick={::this.findPrev}>
          <i className="glyphicon glyphicon-chevron-up"></i>
        </button>
        <button ref="buttonFindNext" onClick={::this.findNext}>
          <i className="glyphicon glyphicon-chevron-down"></i>
        </button>
        <button className="button-close" onClick={::this.close}>
          <i className="glyphicon glyphicon-remove"></i>
        </button>
      </div>
    );
  }
}

function clearSearch(cm) {

  cm.operation(function() {

    let state = getSearchState(cm);
    state.lastQuery = state.query;

    if (! state.query) {
      return;
    }
    state.query = null;
    state.queryText = null;
    cm.removeOverlay(state.overlay);

    if (state.annotate) {
      state.annotate.clear();
      state.annotate = null;
    }
  });
}

function doSearch(args = {}) {

  let {cm, rev, query} = args;

  let state = getSearchState(cm);

  if (state.query) {
    return findNext(cm, rev);
  }

  if (query && (! state.query)) {

    cm.operation(function() {
      startSearch(cm, state, query);
      state.posTo = cm.getCursor();
      state.posFrom = state.posTo;
      findNext(cm, rev);
    });
  }
}

function SearchState() {
  this.lastQuery = null;
  this.overlay = null;
  this.posFrom = null;
  this.posTo = null;
  this.query = null;
}

function findNext(cm, rev) {
  cm.operation(function() {
    let state = getSearchState(cm);
    let cursor = getSearchCursor(cm, state.query, rev ? state.posFrom : state.posTo);

    if (! cursor.find(rev)) {
      cursor = getSearchCursor(cm, state.query, rev ? CodeMirror.Pos(cm.lastLine()) : CodeMirror.Pos(cm.firstLine(), 0));
      if (! cursor.find(rev)) {
        return;
      }
    }
    cm.setSelection(cursor.from(), cursor.to());
    cm.scrollIntoView({from: cursor.from(), to: cursor.to()}, 20);
    state.posFrom = cursor.from();
    state.posTo = cursor.to();
  });
}

function getSearchCursor(cm, query, pos) {
  // Heuristic: if the query string is all lowercase, do a case insensitive search.
  return cm.getSearchCursor(query, pos, queryCaseInsensitive(query));
}

function queryCaseInsensitive(query) {
  return ('string' === typeof query) && (query === query.toLowerCase());
}

function getSearchState(cm) {
  return cm.state.search || (cm.state.search = new SearchState());
}

function startSearch(cm, state, query) {

  state.queryText = query;
  state.query = parseQuery(query);
  cm.removeOverlay(state.overlay, queryCaseInsensitive(state.query));
  state.overlay = searchOverlay(state.query, queryCaseInsensitive(state.query));
  cm.addOverlay(state.overlay);

  if (cm.showMatchesOnScrollbar) {
    if (state.annotate) {
      state.annotate.clear();
      state.annotate = null;
    }
    state.annotate = cm.showMatchesOnScrollbar(state.query, queryCaseInsensitive(state.query));
  }
}

function parseQuery(query) {

  let isRE = query.match(/^\/(.*)\/([a-z]*)$/);

  if (isRE) {
    try {
      query = new RegExp((-1 === isRE[1], isRE[2].indexOf('i')) ? '' : 'i');
    }
    catch(e) {
     // Not a regular expression after all, do a string search
    }
  }
  else {
    query = parseString(query);
  }

  if (_.isString(query) ? ('' === query) : query.test('')) {
    query = /x^/;
  }
  return query;
}

function searchOverlay(query, caseInsensitive) {

  if (_.isString(query)) {
    query = new RegExp(query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), caseInsensitive ? 'gi' : 'g');
  }
  else if (! query.global) {
    query = new RegExp(query.source, query.ignoreCase ? 'gi' : 'g');
  }

  return {
    token: function(stream) {

      query.lastIndex = stream.pos;

      let match = query.exec(stream.string);

      if (match && match.index === stream.pos) {
        stream.pos += match[0].length;
        return 'searching';
      }
      else if (match) {
        stream.pos = match.index;
      }
      else {
        stream.skipToEnd();
      }
    }
  };
}

function parseString(string) {
  return string.replace(/\\(.)/g, function(_, ch) {
    let map = {
      n: '\n',
      r: '\r'
    };
    let char = map[ch];
    return char ? char : ch;
  });
}
