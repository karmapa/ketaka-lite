import DocHelper from '../services/DocHelper';
import React, {PropTypes} from 'react';
import {ModalImportStatus, ModalOpen} from '.';
import classNames from 'classnames';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, CollapsibleNav, DropdownButton, Glyphicon,  MenuItem, Nav, Navbar} from 'react-bootstrap';
import ReactToastr from 'react-toastr';
import _ from 'lodash';
import Ipc from '../services/Ipc';

let {ToastContainer} = ReactToastr;
let ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);

let ipc = window.require('ipc');

export default class Navigation extends React.Component {

  static PropTypes = {
    docs: PropTypes.array.isRequired,
    closeDoc: PropTypes.func.isRequired,
    importDoc: PropTypes.func.isRequired,
    exportData: PropTypes.func.isRequired,
    importData: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired,
    toggleDirection: PropTypes.func.isRequired
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  import() {

    let self = this;

    Ipc.send('import-button-clicked')
      .then(res => {
        self.props.importDoc(res.doc);
        self.refs.toast.success(res.message);
      })
      .catch(res => {
        self.refs.toast.error(res.message);
      });
  }

  overridePaths = [];

  componentDidMount() {

    let self = this;

    ipc.on('import-start', function() {
      self.refs.modalImportStatus.open({
        title: 'Import Status'
      });
    });

    ipc.on('import-progress', function(res) {
      self.refs.modalImportStatus.addMessage(res);
    });

    ipc.on('confirm-bamboo-override', function(res) {
      self.overridePaths = res.paths;
      self.refs.modalImportStatus.showPrompt({
        promptMessage: 'Bamboo ' + res.bambooName + ' exists. Do you want to override it ?'
      });
    });
  }

  overrideBamboo() {

    let self = this;

    self.refs.modalImportStatus.close();

    Ipc.send('import-button-clicked', {overridePaths: self.overridePaths})
      .then(res => {
        self.props.importDoc(res.doc);
        self.refs.toast.success(res.message);
      })
      .catch(res => {
        self.refs.toast.error(res.message);
      });
  }

  cancelOverride() {
    this.overridePaths.length = 0;
    this.refs.modalImportStatus.close();
  }

  onBambooDeleteClick(name) {
    let self = this;
    DocHelper.closeDoc(name);
    Ipc.send('delete-doc', {name})
      .then(res => self.refs.modalOpen.setNames(res.names));
  }

  onBambooClick(name) {
    let self = this;
    let openedDoc = _.find(this.props.docs, {name});
    if (openedDoc) {
      // active this doc if its already opened
      DocHelper.activateTab(openedDoc);
      this.refs.modalOpen.close();
    }
    else {
      Ipc.send('open-bamboo', {name})
        .then(res => {
          self.props.receiveDoc(res.doc);
          self.refs.modalOpen.close();
        });
    }
  }

  open() {
    let self = this;

    Ipc.send('open')
      .then(res => {
        self.refs.modalOpen.open({
          names: res.names
        });
      });
  }

  exportData() {
    DocHelper.exportData(this.refs.dropdownButton);
  }

  render() {

    let {settings, toggleDirection} = this.props;
    let classes = {
      'btn-direction': true,
      'vertical': settings.direction
    };

    return (
      <div>
        <Navbar className="navigation" fluid>
          <CollapsibleNav eventKey={0}>
            <Nav navbar>
              <DropdownButton refs="dropdownButton" eventKey={3} title="Ketaka Lite">
                <MenuItem eventKey="1" onSelect={::this.import}>Import</MenuItem>
                <MenuItem eventKey="2" onSelect={::this.open}>Open</MenuItem>
                <MenuItem eventKey="3" onSelect={DocHelper.save}>Save</MenuItem>
                <MenuItem eventKey="4" onSelect={::this.exportData}>Export</MenuItem>
                <MenuItem eventKey="5">Settings</MenuItem>
              </DropdownButton>
            </Nav>
            <Nav navbar right>
              <MenuItem className="item-direction" eventKey="6" onSelect={toggleDirection}>
                <Button className={classNames(classes)} bsStyle="link"><Glyphicon glyph="pause" /></Button>
              </MenuItem>
            </Nav>
          </CollapsibleNav>
        </Navbar>
        <ModalImportStatus className="modal-import-status" ref="modalImportStatus" promptConfirm={::this.overrideBamboo} promptCancel={::this.cancelOverride} />
        <ModalOpen ref="modalOpen" onBambooClick={::this.onBambooClick} onBambooDeleteClick={::this.onBambooDeleteClick} />
        <ToastContainer ref="toast" toastMessageFactory={ToastMessageFactory} className="toast-top-right" />
      </div>
    );
  }
}
