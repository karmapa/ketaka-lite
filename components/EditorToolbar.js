import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {DropdownButton, MenuItem, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {INPUT_METHOD_SYSTEM, INPUT_METHOD_TIBETAN_EWTS,
  INPUT_METHOD_TIBETAN_SAMBHOTA, INPUT_METHOD_TIBETAN_SAMBHOTA2} from '../constants/AppConstants';
import {PageSwitch} from '.';
import classNames from 'classnames';

export default class EditorToolbar extends React.Component {

  static PropTypes = {
    pageIndex: PropTypes.number,
    pageNames: PropTypes.array,
    readonly: PropTypes.bool,
    className: PropTypes.string,
    onInputChange: PropTypes.func,
    onRedoButtonClick: PropTypes.func,
    onUndoButtonClick: PropTypes.func,
    onReadonlyButtonClick: PropTypes.func,
    onColorButtonClick: PropTypes.func,
    onSettingsButtonClick: PropTypes.func,
    onApplyChunksButtonClick: PropTypes.func,
    onSpellCheckButtonClick: PropTypes.func,
    onPageAddButtonClick: PropTypes.func,
    setInputMethod: PropTypes.func,
    inputMethod: PropTypes.string
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {

    let {onInputChange, onRedoButtonClick, onUndoButtonClick, onReadonlyButtonClick, onColorButtonClick,
      onSettingsButtonClick, onApplyChunksButtonClick, onPageAddButtonClick, pageNames, pageIndex,
      readonly, onSpellCheckButtonClick} = this.props;

    let pageSwitchProps = {
      className: 'section section-doc',
      onInputChange,
      pageNames,
      pageIndex
    };

    let classButtonReadonly = {
      'glyphicon': true,
      'glyphicon-eye-open': readonly,
      'glyphicon-pencil': ! readonly,
    };

    return (
      <div className={this.props.className}>

        <PageSwitch {...pageSwitchProps} />

        <div className="section section-codemirror">

          <OverlayTrigger placement='top' overlay={<Tooltip>Undo</Tooltip>}>
            <button className="button-undo" onClick={onUndoButtonClick}>
              <i className="glyphicon glyphicon-repeat"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement='top' overlay={<Tooltip>Redo</Tooltip>}>
            <button className="button-redo" onClick={onRedoButtonClick}>
              <i className="glyphicon glyphicon-repeat"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement='top' overlay={<Tooltip>Font Color</Tooltip>}>
            <input type="color" className="button-color" />
          </OverlayTrigger>

          <OverlayTrigger placement='top' overlay={<Tooltip>Cut</Tooltip>}>
            <button className="button-cut" onClick={onColorButtonClick}>
              <i className="glyphicon glyphicon-scissors"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement='top' overlay={<Tooltip>Toggle Read Only</Tooltip>}>
            <button className="button-readonly" onClick={onReadonlyButtonClick}>
              <i className={classNames(classButtonReadonly)}></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement='top' overlay={<Tooltip>Spell Check</Tooltip>}>
            <button className="button-spell-check" onClick={onSpellCheckButtonClick}>
              <i className="glyphicon glyphicon-ok"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement='top' overlay={<Tooltip>Doc Settings</Tooltip>}>
            <button className="button-settings" onClick={onSettingsButtonClick}>
              <i className="glyphicon glyphicon-cog"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement='top' overlay={<Tooltip>Apply Chunks From RTF file</Tooltip>}>
            <button className="button-apply-chunks" onClick={onApplyChunksButtonClick}>
              <i className="glyphicon glyphicon-align-center"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement='top' overlay={<Tooltip>Add New Page</Tooltip>}>
            <button className="button-page-add" onClick={onPageAddButtonClick}>
              <i className="glyphicon glyphicon-plus"></i>
            </button>
          </OverlayTrigger>

        </div>

        <div className="section language-section">
          <DropdownButton title={this.props.inputMethod} id='bg-nested-dropdown'>
            {this.renderMenuItem(this.props.inputMethod, [INPUT_METHOD_SYSTEM, INPUT_METHOD_TIBETAN_EWTS, INPUT_METHOD_TIBETAN_SAMBHOTA, INPUT_METHOD_TIBETAN_SAMBHOTA2])}
          </DropdownButton>
        </div>
      </div>
    );
  }

  renderMenuItem(currentMethod, methods) {
    let {setInputMethod} = this.props;
    return methods.map((method, index) => {
      return (
        <MenuItem eventKey={index} key={index} onSelect={setInputMethod.bind(this, method)}>{this.renderCheckMark(currentMethod === method)}{method}</MenuItem>
      );
    });
  }

  renderCheckMark(render) {
    return render ? <i className="glyphicon glyphicon-ok"></i> : <i className="empty"></i>;
  }
}
