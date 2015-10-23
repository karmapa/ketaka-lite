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
  docs: state.docs,
  inputMethod: state.inputMethod,
  readonly: state.readonly,
  settings: state.settings
}))
export default class App extends React.Component {

  componentDidMount() {

    let {dispatch, settings} = this.props;

    document.title = constants.APP_NAME;
    dispatch(AppActions.initSettings());
    this.setBodyClassName(settings.theme);

    ContextMenu.init();
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
