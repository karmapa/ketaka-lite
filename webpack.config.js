var path = require('path');
var webpack = require('webpack');

var config = {
  devtool: 'eval',
  entry: {
    javascript: [
      'webpack-dev-server/client?http://0.0.0.0:3000',
      'webpack/hot/only-dev-server',
      './index'
    ],
    html: './index.html'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  resolve: {
    extensions: ['', '.js']
  },
  module: {
    noParse: /\/levelup\//,
    preLoaders: [
      {
        test: /\.js$/,
        loader: 'eslint-loader',
        configFile: '.eslintrc'
      }
    ],
    loaders: [
      {
        test: /\.js$/,
        loaders: ['react-hot', 'babel'],
        exclude: /node_modules/
      },
      { test: /\.css$/, loaders: 'style-loader!css-loader'},
      {
        test: /\.scss$/,
        loader: 'style!css!sass?outputStyle=expanded'
      },
      {
        test: /\.(ttf|eot|svg)$/,
        loader: 'file-loader?name=[path][name].[ext]'
      },
      {
        test: /\.woff2?$/,
        loader: 'url-loader?name=[path][name].[ext]&limit=10000&minetype=application/font-woff'
      },
      {
        test: /\.(png|jpg|cur)$/,
        loader: 'url-loader?name=[path][name].[ext]&limit=8192'
      },
      {
        test: /\.html$/,
        loader: 'file-loader?name=[name].[ext]'
      }
    ]
  }
};

if ('production' === process.env.NODE_ENV) {
  config.entry.javascript = ['./index'];
}

module.exports = config;
