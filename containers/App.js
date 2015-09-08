import * as AppActions from '../actions/AppActions';
import * as DocActions from '../actions/DocActions';
import * as constants from '../constants/AppConstants';
import EditorArea from '../components/EditorArea';
import Navigation from '../components/Navigation';
import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

@connect(state => ({
  settings: state.settings,
  direction: state.direction,
  readonly: state.readonly,
  docs: state.docs,
  inputMethod: state.inputMethod
}))
export default class App extends React.Component {

  componentDidMount() {
    document.title = constants.APP_NAME;
    this.props.dispatch(AppActions.initSettings());
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
