require('babel/polyfill');
require('./index.scss');

import React from 'react';
import HashHistory from 'react-router/lib/HashHistory';
import Root from './root';

const history = new HashHistory();
React.render(<Root history={history} />, document.getElementById('root'));
