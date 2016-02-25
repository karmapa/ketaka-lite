import {initSettings} from '../modules/app';
import * as constants from '../constants/AppConstants';
import {EditorArea} from '../components';
import React from 'react';
import {connect} from 'react-redux';
import {ContextMenu} from '../services';

@connect(state => ({
  settings: state.settings
}), {initSettings})
export default class App extends React.Component {

  componentDidMount() {

    let {settings} = this.props;

    document.title = constants.APP_NAME;
    initSettings();

    this.changeTheme({newTheme: settings.theme});
    ContextMenu.init();
  }

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

    let currentTheme = this.props.settings.theme;
    let nextTheme = nextProps.settings.theme;

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
      </div>
    );
  }
}
