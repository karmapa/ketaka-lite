import React, {PropTypes} from 'react';
import _ from 'lodash';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {ImeInput} from '.';
import classNames from 'classnames';

import CodeMirror from 'codemirror';

const MODE_SEARCH = 1;
const MODE_REPLACE = 2;
const MODE_CONFIRM = 3;

export default class SearchBar extends React.Component {

  static PropTypes = {
    inputMethod: PropTypes.string.isRequired,
    findNextIndexByKeyword: PropTypes.func.isRequired,
    findPrevIndexByKeyword: PropTypes.func.isRequired,
    setPageIndex: PropTypes.func.isRequired,
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

  find = () => {
    this.openSearchBar();
    this.focus();
    this.setCursor();
    this.findKeyword();
  }

  setCursor = () => {
    if (this.cm) {
      this.cursor = this.cm.getCursor();
    }
  }

  replace = () => {
    this.openReplaceBar();
    this.replaceCursor = this.cm.getCursor();
    this.focus();
    this.findKeyword(this.state.replaceKeyword);
  }

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
    clearSearch(this.cm);
    this.stop();
  }

  onFindInputChange = e => {
    let findKeyword = e.target.value;
    this.setState({
      findKeyword
    });
    this.findKeyword(findKeyword);
  }

  onFindInputKeyUp = e => {

    if (shiftKeyPressed(e)) {
      this.shiftKeyHolding = false;
    }

    if (enterKeyPressed(e) && (! this.shiftKeyHolding)) {
      React.findDOMNode(this.refs.buttonFindNext).click();
    }

    // enter
    if (enterKeyPressed(e) && this.shiftKeyHolding) {
      React.findDOMNode(this.refs.buttonFindPrev).click();
    }
  }

  onFindInputKeyDown = e => {
    if (shiftKeyPressed(e)) {
      this.shiftKeyHolding = true;
    }
  }

  onFindInputKeyPress = inputValue => {
    this.setState({
      findKeyword: inputValue
    });
    this.findKeyword(inputValue);
  }

  onReplaceInputChange = e => {
    let replaceKeyword = e.target.value;
    this.setState({
      replaceKeyword
    });
    this.findKeyword(replaceKeyword);
  }

  onReplaceInputKeyPress = inputValue => {
    this.setState({
      replaceKeyword: inputValue
    });
    this.findKeyword(inputValue);
  }

  onWithInputChange = e => {
    this.setState({
      withKeyword: e.target.value
    });
  }

  onWithInputKeyUp = e => {

    if (enterKeyPressed(e)) {
      let replaceAll = this.shiftKeyHolding;
      this.replaceOne(this.cm, replaceAll);
    }
  }

  onWithInputKeyDown = e => {
    if (shiftKeyPressed(e)) {
      this.shiftKeyHolding = true;
    }
  }

  onWithInputKeyPress = inputValue => {
    this.setState({
      withKeyword: inputValue
    });
  }

  findKeyword(query = this.state.findKeyword) {
    let {cm, cursor} = this;
    clearSearch(cm);
    clearSelection(cm);
    this.doSearch({cm, query, cursor});
  }

  prev = () => {
    this.doSearch({
      cm: this.cm,
      rev: true
    });
    this.cursor = this.cm.getCursor();
  }

  next = () => {
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

    let {findPrevIndexByKeyword, findNextIndexByKeyword, doc, setPageIndex} = this.props;

    cm.operation(function() {
      setTimeout(() => {
        let state = getSearchState(cm);
        let cursor = getSearchCursor(cm, state.query, rev ? state.posFrom : state.posTo);

        if (! cursor.find(rev)) {

          if (rev) {
            let prevPageIndex = findPrevIndexByKeyword(state.query);

            if (_.isNull(prevPageIndex)) {
              return;
            }
            setPageIndex(doc.uuid, prevPageIndex);
            cursor = getSearchCursor(cm, state.query, CodeMirror.Pos(cm.lastLine()));
          }
          else {
            let nextPageIndex = findNextIndexByKeyword(state.query);

            if (_.isNull(nextPageIndex)) {
              return;
            }
            setPageIndex(doc.uuid, nextPageIndex);
            cursor = getSearchCursor(cm, state.query, CodeMirror.Pos(cm.firstLine(), 0));
          }

          if (! cursor.find(rev)) {
            return;
          }
        }
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

  close = () => {
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

  replaceOne(cm, all) {

    if (cm.getOption('readOnly')) {
      return;
    }

    let self = this;
    let query = self.state.replaceKeyword;
    let text = self.state.withKeyword;
    let {doc, writePageContent, findNextIndexByKeyword} = self.props;

    if (! query) {
      return;
    }

    query = parseQuery(query);
    text = parseString(text);

    if (all) {

      query = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

      let queryRegExp = new RegExp(query, 'g');

      self.props.doc.pages.forEach((page, index) => {
        writePageContent(doc.uuid, index, page.content.replace(queryRegExp, text));
      });

      self.close();

    } else {

      let cursorInstance = cm.getCursor();

      if (self.replaceCursor) {
        cursorInstance = self.replaceCursor;
        self.replaceCursor = null;
      }

      let cursor = getSearchCursor(cm, query, cursorInstance);

      let advance = () => {

        let match = cursor.findNext();

        if (! match) {

          let nextPageIndex = findNextIndexByKeyword(query);

          if (! _.isNull(nextPageIndex)) {

            self.props.setPageIndex(doc.uuid, nextPageIndex);

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

  onSearchBoxBlur = e => {
    if (! ['BUTTON', 'INPUT'].includes(_.get(e, 'relatedTarget.tagName'))) {
      this.close();
    }
  }

  renderSearch = () => {

    let classnames = {
      'box-search': true,
      'hidden': ! this.state.opened
    };

    let findInputProps = {
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
      <div className={classNames(classnames)} onBlur={this.onSearchBoxBlur}>
        <span>Search: </span>
        <ImeInput {...findInputProps} />
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
  }

  onReplaceButtonClick = () => {
    this.replaceOne(this.cm);
  }

  onReplaceAllButtonClick = () => {
    let self = this;

    self.openConfirmDialog({
      yes: () => {
        self.replaceOne(self.cm, true);
      },
      no: () => {
        self.close();
      },
      confirmMessage: 'Replace All ?'
    });
  }

  renderReplace = () => {

    let {opened, replaceKeyword, withKeyword} = this.state;
    let {inputMethod} = this.props;

    let classnames = {
      'box-search': true,
      'hidden': ! opened
    };

    let replaceInputProps = {
      inputMethod,
      onChange: this.onReplaceInputChange,
      onKeyPress: this.onReplaceInputKeyPress,
      ref: 'replaceInput',
      value: replaceKeyword
    };

    let withInputProps = {
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
        <ImeInput {...replaceInputProps} />
        <span>With: </span>
        <ImeInput {...withInputProps} />
        <button onClick={this.onReplaceButtonClick}>Replace</button>
        <button onClick={this.onReplaceAllButtonClick}>Replace All</button>
        <button className="button-close" onClick={this.close}>
          <i className="glyphicon glyphicon-remove"></i>
        </button>
      </div>
    );
  }

  yes = () => {
  }

  no = () => {
  }

  stop = () => {
    this.setState({
      mode: MODE_REPLACE,
      opened: false,
      withKeyword: ''
    });
  }

  onConfirmBoxBlur = e => {
    if ('BUTTON' !== _.get(e, 'relatedTarget.tagName')) {
      this.close();
    }
  }

  renderConfirm = () => {

    let {opened, confirmMessage} = this.state;

    let classnames = {
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
  }

  render() {
    let map = {
      [MODE_SEARCH]: this.renderSearch,
      [MODE_REPLACE]: this.renderReplace,
      [MODE_CONFIRM]: this.renderConfirm,
    };
    let renderFunc = map[this.state.mode];

    if (! _.isFunction(renderFunc)) {
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

function clearSelection(cm) {
  if (! cm) {
    return;
  }
  let pos = cm.getCursor();
  cm.setSelection(pos, pos);
}
