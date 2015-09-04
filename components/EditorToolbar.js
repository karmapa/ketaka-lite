import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {DropdownButton, MenuItem, OverlayTrigger, Tooltip, Popover} from 'react-bootstrap';
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
    canShowPageDeleteButton: PropTypes.bool,
    onUndoButtonClick: PropTypes.func,
    onReadonlyButtonClick: PropTypes.func,
    onColorButtonClick: PropTypes.func,
    onSettingsButtonClick: PropTypes.func,
    onApplyChunksButtonClick: PropTypes.func,
    onSpellCheckButtonClick: PropTypes.func,
    onPageAddButtonClick: PropTypes.func,
    onPageDeleteButtonClick: PropTypes.func,
    setInputMethod: PropTypes.func,
    inputMethod: PropTypes.string
  };

  state = {
    showColorBox: false
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  onColorButtonClick(color) {
    this.props.onColorButtonClick(color);
    this.refs.colorBoxOverlay.hide();
  }

  renderColorBox() {

    return (
      <div className="box-colors">
        <div className="row">
          <span className="turquoise" onClick={this.onColorButtonClick.bind(this, 'turquoise')}></span>
          <span className="emerald" onClick={this.onColorButtonClick.bind(this, 'emerald')}></span>
          <span className="peter-river" onClick={this.onColorButtonClick.bind(this, 'peter-river')}></span>
          <span className="amethyst" onClick={this.onColorButtonClick.bind(this, 'amethyst')}></span>
          <span className="black" onClick={this.onColorButtonClick.bind(this, 'black')}></span>
        </div>
        <div className="row">
          <span className="sun-flower" onClick={this.onColorButtonClick.bind(this, 'sun-flower')}></span>
          <span className="carrot" onClick={this.onColorButtonClick.bind(this, 'carrot')}></span>
          <span className="alizarin" onClick={this.onColorButtonClick.bind(this, 'alizarin')}></span>
          <span className="silver" onClick={this.onColorButtonClick.bind(this, 'silver')}></span>
          <span className="asbestos" onClick={this.onColorButtonClick.bind(this, 'asbestos')}></span>
        </div>
      </div>
    );
  }

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

          <OverlayTrigger ref="colorBoxOverlay" placement='top' trigger="click" overlay={<Popover>{this.renderColorBox()}</Popover>}>
            <button className="button-color" onClick={onRedoButtonClick}>
              <i className="glyphicon glyphicon-font"></i>
              <span className="underline"></span>
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

          {this.renderPageDeleteButton()}

        </div>

        <div className="section language-section">
          <DropdownButton title={this.props.inputMethod} id='bg-nested-dropdown'>
            {this.renderMenuItem(this.props.inputMethod, [INPUT_METHOD_SYSTEM, INPUT_METHOD_TIBETAN_EWTS, INPUT_METHOD_TIBETAN_SAMBHOTA, INPUT_METHOD_TIBETAN_SAMBHOTA2])}
          </DropdownButton>
        </div>
      </div>
    );
  }

  renderPageDeleteButton() {
    let {canShowPageDeleteButton, onPageDeleteButtonClick} = this.props;
    if (canShowPageDeleteButton) {
      return (
        <OverlayTrigger placement='top' overlay={<Tooltip>Delete Current Page</Tooltip>}>
          <button className="button-page-delete" onClick={onPageDeleteButtonClick}>
            <i className="glyphicon glyphicon-trash"></i>
          </button>
        </OverlayTrigger>
      );
    }
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
