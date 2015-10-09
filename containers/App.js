import * as AppActions from '../actions/AppActions';
import * as DocActions from '../actions/DocActions';
import * as constants from '../constants/AppConstants';
import {EditorArea, Navigation} from '../components';
import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

@connect(state => ({
  direction: state.direction,
  docs: state.docs,
  inputMethod: state.inputMethod,
  readonly: state.readonly,
  settings: state.settings
}))
export default class App extends React.Component {

  componentDidMount() {
    document.title = constants.APP_NAME;
    this.props.dispatch(AppActions.initSettings());
    this.setBodyClassName(this.props.settings.theme);
  }

  setBodyClassName(className) {
    document.body.className = className;
  }

  componentWillReceiveProps(nextProps) {
    let nextTheme = nextProps.settings.theme;
    if (this.props.settings.theme !== nextTheme) {
      this.setBodyClassName(nextTheme);
    }
  }

  render() {
    const {settings, readonly, direction, docs, inputMethod, dispatch} = this.props;
    const docActions = bindActionCreators(DocActions, dispatch);
    const appActions = bindActionCreators(AppActions, dispatch);

    const navigationProps = {settings, direction, docs, ...docActions, ...appActions};
    const editorAreaProps = {settings, readonly, docs, inputMethod, direction, ...docActions, ...appActions};

    return (
      <div className="container-fluid">
        <Navigation {...navigationProps} />
        <EditorArea className="editor-area" {...editorAreaProps} />
      </div>
    );
  }
}
