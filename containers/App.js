import * as AppActions from '../actions/AppActions';
import * as DocActions from '../actions/DocActions';
import * as constants from '../constants/AppConstants';
import EditorArea from '../components/EditorArea';
import Navigation from '../components/Navigation';
import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

@connect(state => ({
  direction: state.direction,
  readonly: state.readonly,
  docs: state.docs,
  inputMethod: state.inputMethod
}))
export default class App extends React.Component {

  componentDidMount() {
    document.title = constants.APP_NAME;
  }

  render() {
    const {readonly, direction, docs, inputMethod, dispatch} = this.props;
    const docActions = bindActionCreators(DocActions, dispatch);
    const appActions = bindActionCreators(AppActions, dispatch);

    const navigationProps = {direction, docs, ...docActions, ...appActions};
    const editorAreaProps = {readonly, docs, inputMethod, direction, ...docActions, ...appActions};
    return (
      <div className="container-fluid">
        <Navigation {...navigationProps} />
        <EditorArea className="editor-area" {...editorAreaProps} />
      </div>
    );
  }
}
