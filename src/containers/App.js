import * as AppActions from '../actions/AppActions';
import * as DocActions from '../actions/DocActions';
import * as constants from '../constants/AppConstants';
import {EditorArea} from '../components';
import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {ContextMenu} from '../services';

@connect(state => ({
  direction: state.direction,
  settings: state.settings
}))
export default class App extends React.Component {

  componentDidMount() {

    let {dispatch, settings} = this.props;

    document.title = constants.APP_NAME;
    dispatch(AppActions.initSettings());

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
    const {dispatch} = this.props;
    const docActions = bindActionCreators(DocActions, dispatch);
    const appActions = bindActionCreators(AppActions, dispatch);

    const editorAreaProps = {...this.props, ...docActions, ...appActions};

    return (
      <div className="container-fluid root">
        <EditorArea className="editor-area" {...editorAreaProps} />
      </div>
    );
  }
}
