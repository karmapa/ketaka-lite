import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import {isEmpty, isNull, isString, isFunction, get} from 'lodash';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {ImeInput} from '.';
import classNames from 'classnames';

import CodeMirror from 'codemirror';

const MODE_SEARCH = 1;
const MODE_REPLACE = 2;
const MODE_CONFIRM = 3;

export default class SearchBar extends React.Component {

  static PropTypes = {
    doc: PropTypes.object.isRequired,
    findMatchCountByKeyword: PropTypes.func.isRequired,
    findNextIndexByKeyword: PropTypes.func.isRequired,
    findPrevIndexByKeyword: PropTypes.func.isRequired,
    getIndexByMatchIndex: PropTypes.func.isRequired,
    getMatchIndexByQuery: PropTypes.func.isRequired,
    inputMethod: PropTypes.string.isRequired,
    replacePageContent: PropTypes.func.isRequired,
    setPageIndex: PropTypes.func.isRequired,
    toPrevPage: PropTypes.func.isRequired
  };

  state = {
    confirmMessage: '',
    findKeyword: '',
    matchCount: 0,
    mode: MODE_SEARCH,
    opened: false,
    replaceKeyword: '',
    withKeyword: ''
  };

  cm = null;
  cursor = null;
  shiftKeyHolding = false;

  shouldComponentUpdate = shouldPureComponentUpdate;

  find = () => {
    this.openSearchBar();
    this.focus();
    this.setCursor();
    this.findMatchCount(this.state.findKeyword);
    this.findKeyword();
  };

  doDefault = () => {
    if (this.isOpened()) {
      if (MODE_SEARCH === this.state.mode) {
        this.find();
      }
    }
  };

  findMatchCount = keyword => {
    if (isEmpty(keyword)) {
      this.setState({matchCount: 0});
      return;
    }
    if (this.cm) {
      const index = this.cm.indexFromPos(this.cursor);
      const matchCount = this.props.findMatchCountByKeyword(keyword, index);
      this.setState({matchCount});
    }
  };

  setCursor = () => {
    if (this.cm) {
      this.cursor = this.cm.getCursor();
    }
  };

  replace = () => {
    this.openReplaceBar();
    this.replaceCursor = this.cm.getCursor();
    this.focus();
    this.setCursor();
    const {replaceKeyword} = this.state;
    this.findMatchCount(replaceKeyword);
    this.findKeyword(replaceKeyword);
  };

  componentDidMount() {

    CodeMirror.commands.find = () => {};
    CodeMirror.commands.findNext = () => {};
    CodeMirror.commands.findPrev = () => {};
    CodeMirror.commands.replace = () => {};
    CodeMirror.commands.replaceAll = () => {};

    document.addEventListener('keyup', e => {

      if (shiftKeyPressed(e)) {
        this.shiftKeyPressed = false;
      }
    });
  }

  escape = () => {
    const {cm} = this;

    if (cm) {
      clearSearch(cm);
      this.clearSelection(cm);
      cm.focus();
    }
    this.stop();
  };

  onFindInputChange = e => {
    const findKeyword = e.target.value;
    this.setState({
      findKeyword
    });
    this.findMatchCount(findKeyword);
    this.findKeyword(findKeyword);
  };

  onFindInputKeyUp = e => {

    if (shiftKeyPressed(e)) {
      this.shiftKeyHolding = false;
    }

    if (enterKeyPressed(e) && (! this.shiftKeyHolding)) {
      ReactDOM.findDOMNode(this.refs.buttonFindNext).click();
    }

    // enter
    if (enterKeyPressed(e) && this.shiftKeyHolding) {
      ReactDOM.findDOMNode(this.refs.buttonFindPrev).click();
    }
  };

  onFindInputKeyDown = e => {
    if (shiftKeyPressed(e)) {
      this.shiftKeyHolding = true;
    }
  };

  onFindInputKeyPress = findKeyword => {
    this.setState({findKeyword});
    this.findMatchCount(findKeyword);
    this.findKeyword(findKeyword);
  };

  onReplaceInputChange = e => {
    const replaceKeyword = e.target.value;
    this.setState({
      replaceKeyword
    });
    this.findMatchCount(replaceKeyword);
    this.findKeyword(replaceKeyword);
  };

  onReplaceInputKeyPress = replaceKeyword => {
    this.setState({replaceKeyword});
    this.findMatchCount(replaceKeyword);
    this.findKeyword(replaceKeyword);
  };

  onWithInputChange = e => {
    this.setState({
      withKeyword: e.target.value
    });
  };

  onWithInputKeyUp = e => {

    if (enterKeyPressed(e)) {
      const replaceAll = this.shiftKeyHolding;
      this.replaceOne(this.cm, replaceAll);
    }
  };

  onWithInputKeyDown = e => {
    if (shiftKeyPressed(e)) {
      this.shiftKeyHolding = true;
    }
  };

  onWithInputKeyPress = inputValue => {
    this.setState({
      withKeyword: inputValue
    });
  };

  findKeyword(query = this.state.findKeyword) {
    const {cm, cursor} = this;
    clearSearch(cm);
    this.clearSelection(cm);
    this.doSearch({cm, query, cursor});
  }

  prev = () => {
    this.doSearch({
      cm: this.cm,
      rev: true
    });
    this.cursor = this.cm.getCursor();
  };

  next = () => {
    this.doSearch({cm: this.cm});
    this.cursor = this.cm.getCursor();
  };

  doSearch(args = {}) {

    const self = this;
    const {cm, rev, query, cursor} = args;
    const state = getSearchState(cm);

    if (state.query) {
      return self.findNext(cm, rev);
    }

    if (query && (! state.query)) {

      cm.operation(function() {
        startSearch(cm, state, query);
        state.posTo = cursor ? cursor : cm.getCursor();
        state.posFrom = state.posTo;
        self.findNext(cm, rev);
      });
    }
  }

  findNext(cm, rev) {

    const {findPrevIndexByKeyword, findNextIndexByKeyword, doc, setPageIndex} = this.props;

    cm.operation(() => {
      setTimeout(() => {

        const cursor = cm.getCursor();
        const state = getSearchState(cm);

        const index = cm.indexFromPos(cursor);
        state.posFrom = cm.posFromIndex(index - state.query.length);
        state.posTo = cursor;

        let searchCursor = getSearchCursor(cm, state.query, rev ? state.posFrom : state.posTo);

        if (! searchCursor.find(rev)) {

          if (rev) {
            const prevPageIndex = findPrevIndexByKeyword(state.query);

            if (isNull(prevPageIndex)) {
              return;
            }
            setPageIndex(doc.uuid, prevPageIndex);
            searchCursor = getSearchCursor(cm, state.query, CodeMirror.Pos(cm.lastLine()));
          }
          else {
            const nextPageIndex = findNextIndexByKeyword(state.query);

            if (isNull(nextPageIndex)) {
              return;
            }
            setPageIndex(doc.uuid, nextPageIndex);
            searchCursor = getSearchCursor(cm, state.query, CodeMirror.Pos(cm.firstLine(), 0));
          }

          if (! searchCursor.find(rev)) {
            return;
          }
        }
        cm.setSelection(searchCursor.from(), searchCursor.to());
        cm.scrollIntoView({from: searchCursor.from(), to: searchCursor.to()}, 20);
        state.posFrom = searchCursor.from();
        state.posTo = searchCursor.to();
      });
    });
  }

  focus() {
    const {mode} = this.state;

    if (MODE_SEARCH === mode) {
      const findInput = ReactDOM.findDOMNode(this.refs.findInput);
      if (findInput) {
        findInput.focus();
      }
    }
    if (MODE_REPLACE === mode) {
      const replaceInput = ReactDOM.findDOMNode(this.refs.replaceInput);
      if (replaceInput) {
        replaceInput.focus();
      }
    }
  }

  openSearchBar() {
    this.setState({
      mode: MODE_SEARCH,
      opened: true
    });
  }

  openReplaceBar() {
    this.setState({
      mode: MODE_REPLACE,
      opened: true
    });
  }

  close = () => {

    const {cm} = this;

    this.setState({
      opened: false
    });

    if (cm) {
      clearSearch(cm);
      this.clearSelection(cm);
      cm.focus();
    }
  };

  openConfirmDialog(args) {

    this.yes = args.yes;
    this.no = args.no;
    this.setState({
      confirmMessage: args.confirmMessage,
      mode: MODE_CONFIRM
    });
  }

  replaceOne(cm, all) {

    if (cm.getOption('readOnly')) {
      return;
    }

    const self = this;
    const {doc, replacePageContent, findNextIndexByKeyword, getMatchIndexByQuery, getIndexByMatchIndex} = self.props;

    let query = self.state.replaceKeyword;
    let text = self.state.withKeyword;

    if (! query) {
      return;
    }

    query = parseQuery(query);
    text = parseString(text);

    if (all) {

      const self = this;
      const index = this.cm.indexFromPos(this.cm.getCursor());
      const matchIndex = getMatchIndexByQuery(query, index);

      replacePageContent(query, text);

      self.close();

      if (matchIndex > 0) {
        setTimeout(() => {
          const newIndex = getIndexByMatchIndex(text, matchIndex);
          const pos = this.cm.posFromIndex(newIndex);
          self.cm.setCursor(pos);
        });
      }

    } else {

      let cursorInstance = cm.getCursor();

      if (self.replaceCursor) {
        cursorInstance = self.replaceCursor;
        self.replaceCursor = null;
      }

      let cursor = getSearchCursor(cm, query, cursorInstance);

      const advance = () => {

        let match = cursor.findNext();

        if (! match) {

          const nextPageIndex = findNextIndexByKeyword(query);

          if (! isNull(nextPageIndex)) {

            self.props.setPageIndex(doc.uuid, nextPageIndex);

            cursor = getSearchCursor(cm, query);
            setTimeout(() => {
              match = cursor.findNext();
              const from = cursor.from();
              const to = cursor.to();
              cm.setSelection(from, to);
              cm.scrollIntoView({from, to});
            });
            return;
          }
          clearSearch(cm);
          self.stop();
          return;
        }

        const from = cursor.from();
        const to = cursor.to();
        cm.setSelection(from, to);
        cm.scrollIntoView({from, to});

        self.openConfirmDialog({
          yes: () => {
            cursor.replace(isString(query) ? text : text.replace(/\$(\d)/g, (_, i) => match[i]));
            advance();
          },
          no: advance,
          confirmMessage: 'Replace ?'
        });
      };

      advance();
    }
  }

  isOpened = () => this.state.opened;

  renderSearch = () => {

    const classnames = {
      'box-search': true,
      'hidden': ! this.state.opened
    };

    const findInputProps = {
      className: 'find-input',
      onChange: this.onFindInputChange,
      onKeyDown: this.onFindInputKeyDown,
      onKeyUp: this.onFindInputKeyUp,
      onKeyPress: this.onFindInputKeyPress,
      value: this.state.findKeyword,
      ref: 'findInput',
      type: 'text'
    };

    return (
      <div className={classNames(classnames)}>
        <span>Search: </span>
        <div className="wrapper">
          <ImeInput {...findInputProps} />
          <span className="message">{this.state.matchCount} found</span>
        </div>
        <button ref="buttonFindPrev" onClick={this.prev}>
          <i className="glyphicon glyphicon-chevron-up"></i>
        </button>
        <button ref="buttonFindNext" onClick={this.next}>
          <i className="glyphicon glyphicon-chevron-down"></i>
        </button>
        <button className="button-close" onClick={this.close}>
          <i className="glyphicon glyphicon-remove"></i>
        </button>
      </div>
    );
  };

  onReplaceButtonClick = () => {
    this.replaceOne(this.cm);
  };

  onReplaceAllButtonClick = () => {
    const self = this;

    self.openConfirmDialog({
      yes: () => {
        self.replaceOne(self.cm, true);
      },
      no: () => {
        self.close();
      },
      confirmMessage: 'Replace All ?'
    });
  };

  renderReplace = () => {

    const {opened, replaceKeyword, withKeyword} = this.state;
    const {inputMethod} = this.props;

    const classnames = {
      'box-search': true,
      'hidden': ! opened
    };

    const replaceInputProps = {
      className: 'replace-input',
      inputMethod,
      onChange: this.onReplaceInputChange,
      onKeyPress: this.onReplaceInputKeyPress,
      ref: 'replaceInput',
      value: replaceKeyword
    };

    const withInputProps = {
      inputMethod,
      onChange: this.onWithInputChange,
      onKeyDown: this.onWithInputKeyDown,
      onKeyPress: this.onWithInputKeyPress,
      onKeyUp: this.onWithInputKeyUp,
      ref: 'withInput',
      value: withKeyword
    };

    return (
      <div className={classNames(classnames)}>
        <span>Replace: </span>
        <div className="wrapper">
          <ImeInput {...replaceInputProps} />
          <span className="message">{this.state.matchCount} found</span>
        </div>
        <span>With: </span>
        <ImeInput {...withInputProps} />
        <button onClick={this.onReplaceButtonClick}>Replace</button>
        <button onClick={this.onReplaceAllButtonClick}>Replace All</button>
        <button className="button-close" onClick={this.close}>
          <i className="glyphicon glyphicon-remove"></i>
        </button>
      </div>
    );
  };

  yes = () => {};

  no = () => {};

  stop = () => {
    this.setState({
      mode: MODE_REPLACE,
      opened: false,
      withKeyword: ''
    });
  };

  onConfirmBoxBlur = e => {
    if ('BUTTON' !== get(e, 'relatedTarget.tagName')) {
      this.close();
    }
  };

  clearSelection = cm => {
    if (! cm) {
      return;
    }
    const pos = cm.getCursor();
    const {mode, findKeyword, replaceKeyword} = this.state;
    pos.ch -= (MODE_SEARCH === mode) ? findKeyword.length : replaceKeyword.length;
    cm.setSelection(pos, pos);
  };

  renderConfirm = () => {

    const {opened, confirmMessage} = this.state;

    const classnames = {
      'box-search': true,
      'hidden': ! opened
    };

    return (
      <div className={classNames(classnames)} onBlur={this.onConfirmBoxBlur}>
        <span>{confirmMessage}</span>
        <button onClick={this.yes}>Yes</button>
        <button onClick={this.no}>No</button>
        <button onClick={this.stop}>Stop</button>
      </div>
    );
  };

  render() {
    const map = {
      [MODE_SEARCH]: this.renderSearch,
      [MODE_REPLACE]: this.renderReplace,
      [MODE_CONFIRM]: this.renderConfirm,
    };
    const renderFunc = map[this.state.mode];

    if (! isFunction(renderFunc)) {
      throw 'Undefined render function';
    }
    return renderFunc();
  }
}

function clearSearch(cm) {

  if (! cm) {
    return;
  }

  cm.operation(function() {

    const state = getSearchState(cm);
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

function SearchState() {
  this.lastQuery = null;
  this.overlay = null;
  this.posFrom = null;
  this.posTo = null;
  this.query = null;
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

  const isRE = query.match(/^\/(.*)\/([a-z]*)$/);

  if (isRE) {
    try {
      query = new RegExp((-1 === isRE[1], isRE[2].indexOf('i')) ? '' : 'i');
    }
    catch (e) {
     // Not a regular expression after all, do a string search
    }
  }
  else {
    query = parseString(query);
  }

  if (isString(query) ? ('' === query) : query.test('')) {
    query = /x^/;
  }
  return query;
}

function searchOverlay(query, caseInsensitive) {

  if (isString(query)) {
    query = new RegExp(query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), caseInsensitive ? 'gi' : 'g');
  }
  else if (! query.global) {
    query = new RegExp(query.source, query.ignoreCase ? 'gi' : 'g');
  }

  return {
    token: function(stream) {

      query.lastIndex = stream.pos;

      const match = query.exec(stream.string);

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
    const map = {
      n: '\n',
      r: '\r'
    };
    const char = map[ch];
    return char ? char : ch;
  });
}

function enterKeyPressed(e) {
  return 13 === e.keyCode;
}

function shiftKeyPressed(e) {
  return 16 === e.keyCode;
}
