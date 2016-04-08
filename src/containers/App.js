import {initSettings, setElectronVersion, setAppVersion} from '../modules/app';
import * as constants from '../constants/AppConstants';
import {EditorArea} from '../components';
import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {ContextMenu, getWrappedInstance, Api} from '../services';
import {Event} from '../services';
import {ModalAbout} from '../components';

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

    Api.send('get-versions')
      .then(({versions}) => {
        setAppVersion(versions.app);
        setElectronVersion(versions.electron);
      });
  }

  componentWillUnmount() {
    eventHelper.off();
  }

  handleAppAbout = async () => {
    this.getWrappedInstance('modalAbout').openModal();
  };

  changeTheme(args) {

    let {oldTheme, newTheme} = args;
    let classList = document.body.classList;

    if (oldTheme) {
      classList.remove(oldTheme);
    }
    if (newTheme) {
      classList.add(newTheme);
    }
  }

  componentWillReceiveProps(nextProps) {

    let currentTheme = this.props.theme;
    let nextTheme = nextProps.theme;

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
      </div>
    );
  }
}
