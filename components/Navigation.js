import DocHelper from '../services/DocHelper';
import React, {PropTypes} from 'react';
import {ModalImportStatus, ModalOpen} from '.';
import classNames from 'classnames';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Button, CollapsibleNav, DropdownButton, Glyphicon,  MenuItem, Nav, Navbar} from 'react-bootstrap';
import ReactToastr from 'react-toastr';
import _ from 'lodash';

let {ToastContainer} = ReactToastr;
let ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);

let ipc = window.require('ipc');

export default class Navigation extends React.Component {

  static PropTypes = {
    docs: PropTypes.array.isRequired,
    closeDoc: PropTypes.func.isRequired,
    importDoc: PropTypes.func.isRequired,
    direction: PropTypes.bool.isRequired,
    exportData: PropTypes.func.isRequired,
    importData: PropTypes.func.isRequired,
    settings: PropTypes.func.isRequired,
    toggleDirection: PropTypes.func.isRequired
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  import() {
    ipc.send('import-button-clicked');
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

    ipc.on('import-done', function(res) {
      self.props.importDoc(res.doc);
      self.refs.toast.success(res.message);
      DocHelper.import();
    });

    ipc.on('confirm-bamboo-override', function(res) {
      self.overridePaths = res.paths;
      self.refs.modalImportStatus.showPrompt({
        promptMessage: 'Bamboo ' + res.bambooName + ' exists. Do you want to override it ?'
      });
    });

    ipc.on('import-error', function(res) {
      self.refs.toast.error(res.message);
    });

    ipc.on('open-done', function(res) {
      self.refs.modalOpen.open({
        names: res.names
      });
    });

    ipc.on('open-bamboo-done', function(res) {
      self.props.openDoc(res.doc);
      DocHelper.openDoc();
      self.refs.modalOpen.close();
    });
  }

  overrideBamboo() {
    this.refs.modalImportStatus.close();
    ipc.send('import-button-clicked', this.overridePaths);
  }

  cancelOverride() {
    this.overridePaths.length = 0;
    this.refs.modalImportStatus.close();
  }

  onBambooDeleteClick(name) {
    DocHelper.closeDoc(name);
    ipc.send('delete-doc', {name});
  }

  onBambooClick(name) {
    let openedDoc = _.find(this.props.docs, {name});
    if (openedDoc) {
      // active this doc if its already opened
      DocHelper.activateTab(openedDoc);
      this.refs.modalOpen.close();
    }
    else {
      ipc.send('open-bamboo', {name});
    }
  }

  open() {
    ipc.send('open');
  }

  render() {

    let {exportData, settings, toggleDirection, direction} = this.props;
    let classes = {
      'btn-direction': true,
      'vertical': direction
    };

    return (
      <div>
        <Navbar className="navigation" fluid>
          <CollapsibleNav eventKey={0}>
            <Nav navbar>
              <DropdownButton eventKey={3} title="Ketaka Lite">
                <MenuItem eventKey="1" onSelect={::this.import}>Import</MenuItem>
                <MenuItem eventKey="2" onSelect={::this.open}>open</MenuItem>
                <MenuItem eventKey="3" onSelect={DocHelper.save}>Save</MenuItem>
                <MenuItem eventKey="4" onSelect={exportData}>Export</MenuItem>
                <MenuItem eventKey="5" onSelect={settings}>Settings</MenuItem>
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
