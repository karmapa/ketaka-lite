require('codemirror/addon/selection/active-line');
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
    inputMethod: PropTypes.string,
    onCodemirrorChange: PropTypes.func,
    onSettingsButtonClick: PropTypes.func,
    onApplyChunksButtonClick: PropTypes.func,
    onPageAddButtonClick: PropTypes.func,
    onPageDeleteButtonClick: PropTypes.func,
    onReadonlyButtonClick: PropTypes.func,
    canShowPageDeleteButton: PropTypes.bool,
    onColorButtonClick: PropTypes.func,
    onSpellCheckButtonClick: PropTypes.func,
    readonly: PropTypes.bool,
    setInputMethod: PropTypes.func
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
    this.ime.setInputMethod(MAP_INPUT_METHODS[nextProps.inputMethod]);
  }

  onUndoButtonClick() {
    this.codemirror.execCommand('undo');
  }

  onRedoButtonClick() {
    this.codemirror.execCommand('redo');
  }

  render() {

    let {code, className, onInputChange, inputMethod,
      setInputMethod, pageNames, pageIndex, onSettingsButtonClick,
      onPageAddButtonClick, readonly, onApplyChunksButtonClick,
      onReadonlyButtonClick, onSpellCheckButtonClick, onPageDeleteButtonClick,
      canShowPageDeleteButton, onColorButtonClick} = this.props;

    let editorToolbarProps = {
      readonly,
      className: 'editor-toolbar',
      inputMethod,
      pageNames,
      pageIndex,
      setInputMethod,
      onInputChange,
      onRedoButtonClick: ::this.onRedoButtonClick,
      onUndoButtonClick: ::this.onUndoButtonClick,
      onColorButtonClick,
      canShowPageDeleteButton,
      onReadonlyButtonClick,
      onSettingsButtonClick,
      onPageAddButtonClick,
      onPageDeleteButtonClick,
      onSpellCheckButtonClick,
      onApplyChunksButtonClick
    };

    let codemirrorProps = {
      onChange: ::this.onCodemirrorChange,
      options: {
        lineNumbers: true,
        styleActiveLine: true
      },
      ref: 'codemirror',
      value: code
    };

    let classBoxReadonly = {
      'box-readonly': readonly
    };

    let classReadonly = {
      'readonly': readonly
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
