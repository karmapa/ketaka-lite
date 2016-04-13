import {initSettings, setElectronVersion, setAppVersion} from '../modules/app';
import * as constants from '../constants/AppConstants';
import {EditorArea} from '../components';
import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {ContextMenu, getWrappedInstance, Api} from '../services';
import {Event} from '../services';
import {ModalAbout, ModalAlert} from '../components';

const eventHelper = new Event();

@connect(state => ({
  theme: state.app.theme
}), {initSettings, setElectronVersion, setAppVersion})
export default class App extends React.Component {

  static PropTypes = {
    theme: PropTypes.string.isRequired
  };

  getWrappedInstance = getWrappedInstance;

  componentDidMount() {

    const {theme, setAppVersion, setElectronVersion} = this.props;

    document.title = constants.APP_NAME;
    initSettings();

    this.changeTheme({newTheme: theme});
    ContextMenu.init();
    eventHelper.on('app-about', this.handleAppAbout);
    eventHelper.on('app-still-exporting-zip', this.handleAppStillExportingZip);

    Api.send('get-versions')
      .then(({versions}) => {
        setAppVersion(versions.app);
        setElectronVersion(versions.electron);
      });
  }

  componentWillUnmount() {
    eventHelper.off();
  }

  handleAppAbout = () => this.getWrappedInstance('modalAbout').openModal();

  handleAppStillExportingZip = () => {
    return this.getWrappedInstance('modalAlert')
      .openModal({
        title: 'Oops',
        message: 'It\'s still exporting zip. Please close later.'
      });
  };

  changeTheme(args) {

    const {oldTheme, newTheme} = args;
    const classList = document.body.classList;

    if (oldTheme) {
      classList.remove(oldTheme);
    }
    if (newTheme) {
      classList.add(newTheme);
    }
  }

  componentWillReceiveProps(nextProps) {

    const currentTheme = this.props.theme;
    const nextTheme = nextProps.theme;

    if (currentTheme !== nextTheme) {
      this.changeTheme({
        oldTheme: currentTheme,
        newTheme: nextTheme
      });
    }
  }

  render() {
    return (
      <div className="container-fluid root">
        <EditorArea className="editor-area" />
        <ModalAbout ref="modalAbout" />
        <ModalAlert ref="modalAlert" />
      </div>
    );
  }
}
