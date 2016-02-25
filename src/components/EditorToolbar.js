import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Input, OverlayTrigger, Tooltip, Popover} from 'react-bootstrap';
import {DIRECTION_VERTICAL} from '../constants/AppConstants';
import {PageSwitch} from '.';
import classNames from 'classnames';
import {connect} from 'react-redux';

import {setFontSize, setInputMethod, setLineHeight, setLetterSpacing,
  toggleDirection, toggleReadonly} from '../modules/app';

@connect(state => ({
  settings: state.app
}), {setFontSize, setLineHeight, setLetterSpacing, toggleDirection,
  toggleReadonly, setInputMethod})
export default class EditorToolbar extends React.Component {

  static PropTypes = {
    settings: PropTypes.object,
    pageIndex: PropTypes.number,
    pageNames: PropTypes.array,
    className: PropTypes.string,
    onInputChange: PropTypes.func,
    onRedoButtonClick: PropTypes.func,
    canShowPageDeleteButton: PropTypes.bool,
    onUndoButtonClick: PropTypes.func,
    toggleReadonly: PropTypes.func,
    onColorButtonClick: PropTypes.func,
    onSettingsButtonClick: PropTypes.func,
    onSpellCheckButtonClick: PropTypes.func,
    onPageAddButtonClick: PropTypes.func,
    onPrintButtonClick: PropTypes.func,
    toggleDirection: PropTypes.func,
    onPageDeleteButtonClick: PropTypes.func,
    onAddPbFileButtonClick: PropTypes.func,
    onLineHeightInputChange: PropTypes.func,
    onImageOnlyButtonClick: PropTypes.func,
    onTextOnlyButtonClick: PropTypes.func,
    setInputMethod: PropTypes.func,
    setLetterSpacing: PropTypes.func,
    setFontSize: PropTypes.func,
    setLineHeight: PropTypes.func
  };

  state = {
    showColorBox: false
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  onColorButtonClick(color) {
    this.props.onColorButtonClick(color);
    this.refs.colorBoxOverlay.hide();
  }

  onFontSizeInputChange = e => {
    this.props.setFontSize(e.target.value);
  }

  onLineHeightInputChange = e => {
    this.props.setLineHeight(e.target.value);
  }

  onLetterSpacingChange = e => {
    this.props.setLetterSpacing(e.target.value);
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

  onPrintButtonClick = () => {
    this.refs.printOverlay.hide();
    this.props.onPrintButtonClick();
  }

  render() {

    let {onInputChange, onRedoButtonClick, onUndoButtonClick, toggleReadonly,
      onSettingsButtonClick, onPageAddButtonClick, pageNames, pageIndex,
      onSpellCheckButtonClick, settings, onAddPbFileButtonClick,
      onImageOnlyButtonClick, onTextOnlyButtonClick, toggleDirection} = this.props;

    let pageSwitchProps = {
      className: 'section section-doc',
      onInputChange,
      pageNames,
      pageIndex
    };

    let {readonly, spellCheckOn, direction} = settings;

    let classButtonReadonly = {
      'glyphicon': true,
      'glyphicon-eye-open': readonly,
      'glyphicon-pencil': ! readonly,
    };

    let directionButtonProps = {
      className: classNames({
        'btn-direction': true,
        'vertical': DIRECTION_VERTICAL === direction
      }),
      onClick: toggleDirection
    };

    return (
      <div className={this.props.className}>

        <PageSwitch {...pageSwitchProps} />

        <div className="section section-codemirror">

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-undo">Undo</Tooltip>}>
            <button className="button-undo" onClick={onUndoButtonClick}>
              <i className="glyphicon glyphicon-repeat"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-redo">Redo</Tooltip>}>
            <button className="button-redo" onClick={onRedoButtonClick}>
              <i className="glyphicon glyphicon-repeat"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger ref="colorBoxOverlay" placement="bottom" trigger="click" overlay={<Popover id="popover-button-color">{this.renderColorBox()}</Popover>}>
            <button className="button-color">
              <i className="glyphicon glyphicon-font"></i>
              <span className="underline"></span>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-readonly">Toggle Read Only</Tooltip>}>
            <button className="button-readonly" onClick={toggleReadonly}>
              <i className={classNames(classButtonReadonly)}></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-spellcheck">Spell Check</Tooltip>}>
            <button className={classNames({'button-spell-check': true, 'on': spellCheckOn})}
              onClick={onSpellCheckButtonClick}>
              <i className="glyphicon glyphicon-ok"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-page-add">Add New Page</Tooltip>}>
            <button className="button-page-add" onClick={onPageAddButtonClick}>
              <i className="glyphicon glyphicon-plus"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" ref="printOverlay" overlay={<Tooltip id="tooltip-print">Print</Tooltip>}>
            <button onClick={this.onPrintButtonClick}>
              <i className="glyphicon glyphicon-print"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-add-pb-files">Add Page Break Files</Tooltip>}>
            <button className="button-add-pb-files" onClick={onAddPbFileButtonClick}>
              <i className="glyphicon glyphicon-open-file"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-image-area-only">Image Area Only</Tooltip>}>
            <button className={classNames({on: settings.showImageOnly})} onClick={onImageOnlyButtonClick}>
              <i className="glyphicon glyphicon-picture"></i>
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-text-area-only">Text Area Only</Tooltip>}>
            <button className={classNames({on: settings.showTextOnly})} onClick={onTextOnlyButtonClick}>
              <i className="glyphicon glyphicon-subscript"></i>
            </button>
          </OverlayTrigger>

          {this.renderPageDeleteButton()}

        </div>

        <div className="section">

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-font-size">Font Size</Tooltip>}>
            <div className="box-font">
              <span>
                <i className="glyphicon glyphicon-text-height"></i>
              </span>
              <Input bsSize="small" type="select"
                     onChange={this.onFontSizeInputChange} value={settings.fontSize}>
                {this.renderFontSizeOptions()}
              </Input>
            </div>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-line-height">Line Height</Tooltip>}>
            <div className="box-font">
              <span>
                <i className="glyphicon glyphicon-sort-by-attributes"></i>
              </span>
              <Input bsSize="small" type="select"
                     onChange={this.onLineHeightInputChange} value={settings.lineHeight}>
                {this.renderLineHeightOptions()}
              </Input>
            </div>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-letter-spacing">Letter Spacing</Tooltip>}>
            <div className="box-font">
              <span>
                <i className="glyphicon glyphicon-text-width"></i>
              </span>
              <Input bsSize="small" type="select"
                     onChange={this.onLetterSpacingChange} value={settings.letterSpacing}>
                {this.renderLetterSpacingOptions()}
              </Input>
            </div>
          </OverlayTrigger>
        </div>

        <div className="section">
          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-direction">Direction</Tooltip>}>
            <button {...directionButtonProps}>
              <i className="glyphicon glyphicon-pause"></i>
            </button>
          </OverlayTrigger>
          <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-doc-settings">Doc Settings</Tooltip>}>
            <button className="button-settings" onClick={onSettingsButtonClick}>
              <i className="glyphicon glyphicon-cog"></i>
            </button>
          </OverlayTrigger>
        </div>

      </div>
    );
  }

  renderLetterSpacingOptions() {
    return Array.from(Array(5).keys()).map((value, index) => {
      return <option key={index} value={index + 1}>{index + 1}</option>;
    });
  }

  renderLineHeightOptions() {
    return Array.from(Array(30).keys()).map((value, index) => {
      return <option key={index} value={index + 1}>{index + 1}</option>;
    });
  }

  renderFontSizeOptions() {
    return Array.from(Array(30).keys()).map((value, index) => {
      return <option key={index} value={index + 1}>{index + 1}</option>;
    });
  }

  renderPageDeleteButton() {
    let {canShowPageDeleteButton, onPageDeleteButtonClick} = this.props;
    if (canShowPageDeleteButton) {
      return (
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-page-delete">Delete Current Page</Tooltip>}>
          <button className="button-page-delete" onClick={onPageDeleteButtonClick}>
            <i className="glyphicon glyphicon-trash"></i>
          </button>
        </OverlayTrigger>
      );
    }
  }

  renderCheckMark(render) {
    return render ? <i className="glyphicon glyphicon-ok"></i> : <i className="empty"></i>;
  }
}
