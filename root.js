import React, {PropTypes} from 'react';
import {Redirect, Router, Route} from 'react-router';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import * as reducers from './reducers';
import App from './containers/App';
import About from './containers/About';

const reducer = combineReducers(reducers);
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
        {renderRoutes.bind(null, history)}
      </Provider>
    );
  }
}

function renderRoutes(history) {
  return (
    <Router history={history}>
      <Route path="/" component={App} />
      <Route path="about" component={About} />
      <Redirect from="*" to="/" />
    </Router>
  );
}
