import React, {PropTypes} from 'react';
import {Redirect, Router, Route} from 'react-router';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import reducer from './modules/reducer';
import App from './containers/App';

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
const store = createStoreWithMiddleware(reducer);

export default class Root extends React.Component {

  static propTypes = {
    history: PropTypes.object.isRequired
  };

  render() {
    const {history} = this.props;

    return (
      <Provider store={store}>
        <Router history={history}>
          <Route path="/" component={App} />
          <Redirect from="*" to="/" />
        </Router>
      </Provider>
    );
  }
}
