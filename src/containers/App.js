import {initSettings} from '../modules/app';
import * as constants from '../constants/AppConstants';
import {EditorArea} from '../components';
import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {ContextMenu} from '../services';

@connect(state => ({
  theme: state.app.theme
}), {initSettings})
export default class App extends React.Component {

  static PropTypes = {
    theme: PropTypes.string.isRequired
  };

  componentDidMount() {

    document.title = constants.APP_NAME;
    initSettings();

    this.changeTheme({newTheme: this.props.theme});
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
      </div>
    );
  }
}
