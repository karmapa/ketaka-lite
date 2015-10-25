import React, {PropTypes} from 'react';
import _ from 'lodash';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Ime} from '../services';
import {MAP_INPUT_METHODS} from '../constants/AppConstants';
import classNames from 'classnames';

import CodeMirror from 'codemirror';

const MODE_SEARCH = 1;
const MODE_REPLACE = 2;
const MODE_CONFIRM = 3;

export default class SearchBar extends React.Component {

  static PropTypes = {
    inputMethod: PropTypes.string.isRequired,
    nextPageHasMatched: PropTypes.func.isRequired,
    prevPageHasMatched: PropTypes.func.isRequired,
    toNextPage: PropTypes.func.isRequired,
    toPrevPage: PropTypes.func.isRequired,
    doc: PropTypes.object.isRequired,
    writePageContent: PropTypes.func.isRequired
  };

  state = {
    mode: MODE_SEARCH,
    opened: false,
    replaceKeyword: '',
    findKeyword: '',
    withKeyword: '',
    confirmMessage: ''
  }

  cm = null;
  cursor = null;
  shiftKeyHolding = false;

  shouldComponentUpdate = shouldPureComponentUpdate;

  saveCursor() {
    this.cursor = this.cm.getCursor();
  }

  componentDidMount() {
    let self = this;
    self.ime = Ime;
    self.ime.setInputMethod(MAP_INPUT_METHODS[self.props.inputMethod]);

    CodeMirror.commands.find = () => {
      self.openSearchBar();
      self.focus();
      self.setCursorToStart();
      self.find();
    };

    CodeMirror.commands.replace = () => {
      self.openReplaceBar();
      self.focus();
      self.setCursorToStart();
      self.find(this.state.replaceKeyword);
    };

    CodeMirror.commands.replaceAll = () => {};

    document.addEventListener('keyup', e => {

      let keyCode = e.keyCode;
      // y
      if (89 === keyCode) {
        self.yes();
      }
      // n
      if (78 === keyCode) {
        self.no();
      }
      // esc
      if (escKeyPressed(e)) {
        clearSearch(this.cm);
        self.stop();
      }
      if (shiftKeyPressed(e)) {
        this.shiftKeyPressed = false;
      }
    });
  }

  onFindInputChange(e) {
    let findKeyword = e.target.value;
    this.setState({
      findKeyword
    });
    this.find(findKeyword);
  }

  onFindInputKeyUp(e) {
    this.ime.keyup(e);

    if (enterKeyPressed(e) && (! this.shiftKeyHolding)) {
      React.findDOMNode(this.refs.buttonFindNext).click();
    }

    // enter
    if (enterKeyPressed(e) && this.shiftKeyHolding) {
      React.findDOMNode(this.refs.buttonFindPrev).click();
    }
  }

  onFindInputKeyDown(e) {
    this.ime.keydown(e);

    if (shiftKeyPressed(e)) {
      this.shiftKeyHolding = true;
    }
  }

  onFindInputKeyPress(ref, e) {

    let findInput = React.findDOMNode(this.refs[ref]);
    let inputValue = this.ime.keypress(e, {element: findInput});

    if (_.isString(inputValue)) {
      this.setState({
        findKeyword: inputValue
      });
      this.find(inputValue);
    }
  }

  onReplaceInputChange(e) {
    let replaceKeyword = e.target.value;
    this.setState({
      replaceKeyword
    });
    this.find(replaceKeyword);
  }

  onReplaceInputKeyUp(e) {
    this.ime.keyup(e);
  }

  onReplaceInputKeyDown(e) {
    this.ime.keydown(e);
  }

  onReplaceInputKeyPress(ref, e) {

    let replaceInput = React.findDOMNode(this.refs[ref]);
    let inputValue = this.ime.keypress(e, {element: replaceInput});

    if (_.isString(inputValue)) {
      this.setState({
        replaceKeyword: inputValue
      });
      this.find(inputValue);
    }
  }

  onWithInputChange(e) {
    this.setState({
      withKeyword: e.target.value
    });
  }

  setCursorToStart() {
    let cm = this.cm;
    let from = CodeMirror.Pos(cm.firstLine(), 0);
    cm.setSelection(from, from);
    this.cursor = from;
  }

  onWithInputKeyUp(e) {

    this.ime.keyup(e);

    if (enterKeyPressed(e)) {
      let replaceAll = this.shiftKeyHolding;
      this.setCursorToStart();
      this.replace(this.cm, replaceAll);
    }
  }

  onWithInputKeyDown(e) {
    if (shiftKeyPressed(e)) {
      this.shiftKeyHolding = true;
    }
    this.ime.keydown(e);
  }

  onWithInputKeyPress(ref, e) {

    let withInput = React.findDOMNode(this.refs[ref]);
    let inputValue = this.ime.keypress(e, {element: withInput});

    if (_.isString(inputValue)) {
      this.setState({
        withKeyword: inputValue
      });
    }
  }

  find(query = this.state.findKeyword) {
    let {cm, cursor} = this;
    clearSearch(cm);
    clearSelection(cm);
    this.doSearch({cm, query, cursor});
  }

  prev() {
    this.doSearch({
      cm: this.cm,
      rev: true
    });
    this.cursor = this.cm.getCursor();
  }

  next() {
    this.doSearch({cm: this.cm});
    this.cursor = this.cm.getCursor();
  }

  doSearch(args = {}) {

    let self = this;
    let {cm, rev, query, cursor} = args;
    let state = getSearchState(cm);

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

    let self = this;

    cm.operation(function() {
      let state = getSearchState(cm);
      let cursor = getSearchCursor(cm, state.query, rev ? state.posFrom : state.posTo);

      if (! cursor.find(rev)) {

        if (rev) {
          if (! self.props.prevPageHasMatched(state.query)) {
            return;
          }
          self.props.toPrevPage();
          cursor = getSearchCursor(cm, state.query, CodeMirror.Pos(cm.lastLine()));
        }
        else {
          if (! self.props.nextPageHasMatched(state.query)) {
            return;
          }
          self.props.toNextPage();
          cursor = getSearchCursor(cm, state.query, CodeMirror.Pos(cm.firstLine(), 0));
        }

        if (! cursor.find(rev)) {
          return;
        }
      }
      setTimeout(() => {
        cm.setSelection(cursor.from(), cursor.to());
        cm.scrollIntoView({from: cursor.from(), to: cursor.to()}, 20);
        state.posFrom = cursor.from();
        state.posTo = cursor.to();
      });
    });
  }

  focus() {
    let {mode} = this.state;

    if (MODE_SEARCH === mode) {
      let findInput = React.findDOMNode(this.refs.findInput);
      if (findInput) {
        findInput.focus();
      }
    }
    if (MODE_REPLACE === mode) {
      let replaceInput = React.findDOMNode(this.refs.replaceInput);
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

  close() {
    let {cm} = this;
    clearSearch(cm);
    clearSelection(cm);
    this.setState({
      opened: false
    });
    cm.focus();
  }

  openConfirmDialog(args) {

    this.yes = args.yes;
    this.no = args.no;
    this.setState({
      confirmMessage: args.confirmMessage,
      mode: MODE_CONFIRM
    });
  }

  replace(cm, all) {

    if (cm.getOption('readOnly')) {
      return;
    }

    let self = this;
    let query = self.state.replaceKeyword;
    let text = self.state.withKeyword;

    if (! query) {
      return;
    }

    query = parseQuery(query);
    text = parseString(text);

    if (all) {

      let queryRegExp = new RegExp(query, 'g');
      let {doc, writePageContent} = self.props;

      self.props.doc.pages.forEach((page, index) => {
        writePageContent(doc.uuid, index, page.content.replace(queryRegExp, text));
      });

      self.close();

    } else {

      let cursor = getSearchCursor(cm, query, cm.getCursor());

      let advance = () => {

        let match = cursor.findNext();

        if (! match) {

          if (self.props.nextPageHasMatched(query)) {
            self.props.toNextPage();
            cursor = getSearchCursor(cm, query);
            setTimeout(() => {
              match = cursor.findNext();
              let from = cursor.from();
              let to = cursor.to();
              cm.setSelection(from, to);
              cm.scrollIntoView({from, to});
            });
            return;
          }
          clearSearch(cm);
          self.stop();
          return;
        }

        let from = cursor.from();
        let to = cursor.to();
        cm.setSelection(from, to);
        cm.scrollIntoView({from, to});

        self.openConfirmDialog({
          yes: () => {
            cursor.replace(_.isString(query) ? text : text.replace(/\$(\d)/g, (_, i) => match[i]));
            advance();
          },
          no: advance,
          confirmMessage: 'Replace ?'
        });
      };

      advance();
    }
  }

  onSearchBoxBlur(e) {
    if ('BUTTON' !== _.get(e, 'relatedTarget.tagName')) {
      this.close();
    }
  }

  renderSearch() {

    let classnames = {
      'box-search': true,
      'hidden': ! this.state.opened
    };

    let findInputProps = {
      className: 'find-input',
      onChange: ::this.onFindInputChange,
      onKeyDown: ::this.onFindInputKeyDown,
      onKeyUp: ::this.onFindInputKeyUp,
      onKeyPress: this.onFindInputKeyPress.bind(this, 'findInput'),
      value: this.state.findKeyword,
      ref: 'findInput',
      type: 'text'
    };

    return (
      <div className={classNames(classnames)} onBlur={::this.onSearchBoxBlur}>
        <span>Search: </span>
        <input {...findInputProps} />
        <button ref="buttonFindPrev" onClick={::this.prev}>
          <i className="glyphicon glyphicon-chevron-up"></i>
        </button>
        <button ref="buttonFindNext" onClick={::this.next}>
          <i className="glyphicon glyphicon-chevron-down"></i>
        </button>
        <button className="button-close" onClick={::this.close}>
          <i className="glyphicon glyphicon-remove"></i>
        </button>
      </div>
    );
  }

  onReplaceButtonClick() {
    this.setCursorToStart();
    this.replace(this.cm);
  }

  onReplaceAllButtonClick() {
    let self = this;

    self.openConfirmDialog({
      yes: () => {
        self.replace(self.cm, true);
      },
      no: () => {
        self.close();
      },
      confirmMessage: 'Replace All ?'
    });
  }

  renderReplace() {

    let {opened, replaceKeyword, withKeyword} = this.state;

    let classnames = {
      'box-search': true,
      'hidden': ! opened
    };

    let replaceInputProps = {
      onChange: ::this.onReplaceInputChange,
      onKeyDown: ::this.onReplaceInputKeyDown,
      onKeyPress: this.onReplaceInputKeyPress.bind(this, 'replaceInput'),
      onKeyUp: ::this.onReplaceInputKeyUp,
      ref: 'replaceInput',
      type: 'text',
      value: replaceKeyword
    };

    let withInputProps = {
      onChange: ::this.onWithInputChange,
      onKeyDown: ::this.onWithInputKeyDown,
      onKeyPress: this.onWithInputKeyPress.bind(this, 'withInput'),
      onKeyUp: ::this.onWithInputKeyUp,
      ref: 'withInput',
      type: 'text',
      value: withKeyword
    };

    return (
      <div className={classNames(classnames)}>
        <span>Replace: </span>
        <input {...replaceInputProps} />
        <span>With: </span>
        <input {...withInputProps} />
        <button onClick={::this.onReplaceButtonClick}>Replace</button>
        <button onClick={::this.onReplaceAllButtonClick}>Replace All</button>
      </div>
    );
  }

  yes() {
  }

  no() {
  }

  stop() {
    this.setState({
      mode: MODE_REPLACE,
      opened: false,
      withKeyword: ''
    });
  }

  onConfirmBoxBlur(e) {
    if ('BUTTON' !== _.get(e, 'relatedTarget.tagName')) {
      this.close();
    }
  }

  renderConfirm() {

    let {opened, confirmMessage} = this.state;

    let classnames = {
      'box-search': true,
      'hidden': ! opened
    };

    return (
      <div className={classNames(classnames)} onBlur={::this.onConfirmBoxBlur}>
        <span>{confirmMessage}</span>
        <button onClick={::this.yes}>Yes</button>
        <button onClick={::this.no}>No</button>
        <button onClick={::this.stop}>Stop</button>
      </div>
    );
  }

  render() {
    let map = {
      [MODE_SEARCH]: ::this.renderSearch,
      [MODE_REPLACE]: ::this.renderReplace,
      [MODE_CONFIRM]: ::this.renderConfirm,
    };
    let renderFunc = map[this.state.mode];

    if (! _.isFunction(renderFunc)) {
      throw 'Undefined render function';
    }
    return renderFunc();
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

function enterKeyPressed(e) {
  return 13 === e.keyCode;
}

function shiftKeyPressed(e) {
  return 16 === e.keyCode;
}

function escKeyPressed(e) {
  return 27 === e.keyCode;
}

function clearSelection(cm) {
  let pos = cm.getCursor();
  cm.setSelection(pos, pos);
}