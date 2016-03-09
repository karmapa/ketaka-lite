require('codemirror/addon/selection/active-line');
require('codemirror/addon/search/search');
require('codemirror/addon/search/searchcursor');

import React, {PropTypes} from 'react';
import Codemirror from 'react-codemirror';
import Ime from '../services/Ime';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {MAP_INPUT_METHODS, INPUT_METHOD_TIBETAN_SAMBHOTA,
  INPUT_METHOD_TIBETAN_SAMBHOTA2} from '../constants/AppConstants';
import classNames from 'classnames';
import {connect} from 'react-redux';

@connect(state => ({
  fontSize: state.app.fontSize,
  inputMethod: state.app.inputMethod,
  letterSpacing: state.app.letterSpacing,
  lineHeight: state.app.lineHeight,
  readonly: state.app.readonly,
  theme: state.app.theme
}), {}, null, {withRef: true})
export default class Editor extends React.Component {

  static PropTypes = {
    fontSize: PropTypes.number.isRequired,
    lineHeight: PropTypes.number.isRequired,
    letterSpacing: PropTypes.number.isRequired,
    readonly: PropTypes.bool.isRequired,
    style: PropTypes.prop,
    className: PropTypes.string,
    code: PropTypes.string,
    onCodemirrorChange: PropTypes.func,
    theme: PropTypes.string.isRequired,
    inputMethod: PropTypes.string.isRequired
  };

  state = {
    stacking: false
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  isVowels(e) {
    let vowelsKeyCodes = [65, 69, 73, 79, 85];
    return vowelsKeyCodes.includes(e.keyCode);
  }

  checkVowels = e => {
    let inputMethods = [
      INPUT_METHOD_TIBETAN_SAMBHOTA,
      INPUT_METHOD_TIBETAN_SAMBHOTA2
    ];
    if (this.isVowels(e) && inputMethods.includes(this.props.inputMethod)) {
      this.setState({
        stacking: false
      });
    }
  };

  isStackingKey = e => {
    let inputMethod = this.props.inputMethod;

    if (INPUT_METHOD_TIBETAN_SAMBHOTA === inputMethod) {
      // a
      return 65 === e.keyCode;
    }

    if (INPUT_METHOD_TIBETAN_SAMBHOTA2 === inputMethod) {
      // f
      return 70 === e.keyCode;
    }

    return false;
  };

  componentDidMount() {

    this.ime = Ime;
    this.codemirror = this.refs.codemirror.getCodeMirror();

    let {ime, codemirror} = this;

    this.imeKeypress = (cm, e) => ime.keypress(e, {cm});
    this.imeKeydown = (cm, e) => {
      ime.keydown(e, {cm});
      if (this.isStackingKey(e)) {
        this.setState({
          stacking: ! this.state.stacking
        });
        return;
      }
      this.checkVowels(e);
    };
    this.imeKeyup = (cm, e) => ime.keyup(e, {cm});

    codemirror.on('keypress', this.imeKeypress);
    codemirror.on('keydown', this.imeKeydown);
    codemirror.on('keyup', this.imeKeyup);

    let {width, height} = this.props.style;
    codemirror.setSize(width, height);
  }

  onCodemirrorChange = content => {
    this.props.onCodemirrorChange(this.codemirror, content);
  };

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

    if (this.props.theme !== nextProps.theme) {
      // force codemirror to reload theme
      this.codemirror.setOption('theme', nextProps.theme);
    }

    if (this.props.style.height !== nextProps.style.height) {
      this.codemirror.setSize(nextProps.style.width, nextProps.style.height);
    }
    if (this.props.style.width !== nextProps.style.width) {
      this.codemirror.setSize(nextProps.style.width, nextProps.style.height);
    }
  }

  hasFocus() {
    return this.codemirror.hasFocus();
  }

  undo() {
    this.codemirror.execCommand('undo');
  }

  redo() {
    this.codemirror.execCommand('redo');
  }

  componentDidUpdate(previousProps) {

    let self = this;

    ['fontSize', 'lineHeight', 'letterSpacing'].every(prop => {
      if (previousProps[prop] !== self.props[prop]) {
        self.refresh();
        return false;
      }
      return true;
    });
  }

  render() {

    let {code, className, fontSize, lineHeight, letterSpacing, readonly, theme} = this.props;

    let codemirrorProps = {
      onChange: this.onCodemirrorChange,
      options: {
        theme: theme,
        lineWrapping: true,
        lineNumbers: true,
        styleActiveLine: true,
        extraKeys: {
          Tab: cm => {
            // indent with 2 spaces
            cm.replaceSelection('  ');
          }
        }
      },
      ref: 'codemirror',
      value: code
    };

    let classBoxReadonly = {
      'box-readonly': readonly
    };

    let classReadonly = {
      'readonly': readonly,
      ['fs' + fontSize]: true,
      ['lh' + lineHeight]: true,
      ['ls' + letterSpacing]: true
    };

    let wrapperClasses = {
      [className]: true,
      'stacking': this.state.stacking
    };

    return (
      <div className={classNames(wrapperClasses)}>
        <div className={classNames(classBoxReadonly)}>
          <div className={classNames(classReadonly)}>
            <Codemirror {...codemirrorProps} />
          </div>
        </div>
      </div>
    );
  }
}
