require('codemirror/addon/selection/active-line');
require('codemirror/addon/search/search');
require('codemirror/addon/search/searchcursor');

import React, {PropTypes} from 'react';
import Codemirror from 'react-codemirror';
import EditorToolbar from './EditorToolbar';
import Ime from '../services/Ime';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {MAP_INPUT_METHODS} from '../constants/AppConstants';
import classNames from 'classnames';

export default class Editor extends React.Component {

  static PropTypes = {
    className: PropTypes.string,
    code: PropTypes.string,
    pageIndex: PropTypes.number,
    pageNames: PropTypes.array,
    onInputChange: PropTypes.func,
    onCodemirrorChange: PropTypes.func,
    onSettingsButtonClick: PropTypes.func,
    onApplyChunksButtonClick: PropTypes.func,
    onPageAddButtonClick: PropTypes.func,
    onPageDeleteButtonClick: PropTypes.func,
    onReadonlyButtonClick: PropTypes.func,
    canShowPageDeleteButton: PropTypes.bool,
    onColorButtonClick: PropTypes.func,
    onSpellCheckButtonClick: PropTypes.func,
    setInputMethod: PropTypes.func,
    settings: PropTypes.object,
    setFontSize: PropTypes.func,
    setLetterSpacing: PropTypes.func,
    setLineHeight: PropTypes.func
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  componentDidMount() {

    this.ime = Ime;
    this.codemirror = this.refs.codemirror.getCodeMirror();

    let {ime, codemirror} = this;

    this.imeKeypress = (cm, e) => ime.keypress(e, {cm});
    this.imeKeydown = (cm, e) => ime.keydown(e, {cm});
    this.imeKeyup = (cm, e) => ime.keyup(e, {cm});

    codemirror.on('keypress', this.imeKeypress);
    codemirror.on('keydown', this.imeKeydown);
    codemirror.on('keyup', this.imeKeyup);
  }

  onCodemirrorChange(content) {
    this.props.onCodemirrorChange(this.codemirror, content);
  }

  refresh() {
    if (this.codemirror) {
      this.codemirror.refresh();
    }
  }

  componentWillUnmount() {
    let {codemirror} = this;
    codemirror.off('keypress', this.imeKeypress);
    codemirror.off('keydown', this.imeKeydown);
    codemirror.off('keyup', this.imeKeyup);
  }

  componentWillReceiveProps(nextProps) {
    this.ime.setInputMethod(MAP_INPUT_METHODS[nextProps.settings.inputMethod]);

    if (this.props.settings.theme !== nextProps.settings.theme) {
      // force codemirror to reload theme
      this.forceUpdate();
    }
  }

  onUndoButtonClick() {
    this.codemirror.execCommand('undo');
  }

  onRedoButtonClick() {
    this.codemirror.execCommand('redo');
  }

  componentDidUpdate(previousProps) {

    let self = this;
    let previousSettings = previousProps.settings;
    let settings = self.props.settings;

    ['fontSize', 'lineHeight', 'letterSpacing'].every(prop => {
      if (previousSettings[prop] !== settings[prop]) {
        self.refresh();
        return false;
      }
      return true;
    });
  }

  render() {

    let {code, className, onInputChange, setInputMethod, pageNames, pageIndex,
      onSettingsButtonClick, onPageAddButtonClick, onApplyChunksButtonClick,
      onReadonlyButtonClick, onSpellCheckButtonClick, onPageDeleteButtonClick,
      canShowPageDeleteButton, onColorButtonClick, settings, setFontSize, setLineHeight,
      setLetterSpacing} = this.props;

    let editorToolbarProps = {
      className: 'editor-toolbar',
      pageNames,
      pageIndex,
      setInputMethod,
      onInputChange,
      setFontSize,
      setLineHeight,
      setLetterSpacing,
      onRedoButtonClick: ::this.onRedoButtonClick,
      onUndoButtonClick: ::this.onUndoButtonClick,
      onColorButtonClick,
      canShowPageDeleteButton,
      onReadonlyButtonClick,
      onSettingsButtonClick,
      onPageAddButtonClick,
      onPageDeleteButtonClick,
      onSpellCheckButtonClick,
      settings,
      onApplyChunksButtonClick
    };

    let codemirrorProps = {
      onChange: ::this.onCodemirrorChange,
      options: {
        theme: settings.theme,
        lineWrapping: false,
        lineNumbers: true,
        styleActiveLine: true
      },
      ref: 'codemirror',
      value: code
    };

    let {readonly} = settings;

    let classBoxReadonly = {
      'box-readonly': readonly
    };

    let classReadonly = {
      'readonly': readonly,
      ['fs' + settings.fontSize]: true,
      ['lh' + settings.lineHeight]: true,
      ['ls' + settings.letterSpacing]: true
    };

    return (
      <div className={className}>
        <EditorToolbar {...editorToolbarProps} />
        <div className={classNames(classBoxReadonly)}>
          <div className={classNames(classReadonly)}>
            <Codemirror {...codemirrorProps} />
          </div>
        </div>
      </div>
    );
  }
}
