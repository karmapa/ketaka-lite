[![Build Status](https://travis-ci.org/karmapa/ketaka-lite.svg?branch=master)](https://travis-ci.org/karmapa/ketaka-lite)
# KETAKA Lite
 A standalone application that enables file format conversion and file import and has a built-in simple editor allowing users edit their imported data.
 
[Download KETAKA Lite](https://goo.gl/Q851bH)

[KETAKA Lite Technical Specification Documentation](https://github.com/kmsheng/ketaka-lite/blob/master/assets/files/documentation/Ketaka%20Lite%20Techinical%20Documentation%20v1.2.pdf)

![KETAKA Lite](https://raw.githubusercontent.com/kmsheng/ketaka-lite/master/assets/files/documentation/ketaka-lite-explain.png)

## Note:
Currently only support Node.js 5.8.0,
if your Node.js version isn't 5.8.0,
be sure to use node version manager to switch your Node.js version to 5.8.0

## Front-end environment setup
```
sudo npm install -g electron-prebuilt@1.1.0 --unsafe-perm=true --allow-root
npm install
npm run dev
```

## Packaging
```
npm run build
cd dist

// for mac
electron-packager ./ KETAKA-Lite --platform=darwin --arch=x64 --version={version} --icon=treasure_logo.icns

// for windows
electron-packager ./ KETAKA-Lite --platform=win32 --arch=ia32 --version={version} --icon=treasure_logo.ico
```

## Project dependencies:

* bootstrap-sass - The SCSS ( Sassy CSS ) version of Twitter Bootstrap.
* classnames - `className` helper that does something like Angular's ngClass.
* codemirror - Library provides basic feature of an editor.
* eventemitter3 - For components that don't have a parent-child relationship to communicate.
* humps - Useful camelize and decamelize functions.
* keypress.js - Allows you to capturing keyboard input, not only a keyCode but also a combo.
* lodash - Utility library that allows you to do functional programming.
* node-uuid - This is used to generate uuid for KETAKA doc data (each tab contains a doc data)
* react
* react-bootstrap - React version of Twitter Bootstrap, buttons, modals and fancy progressbar.
* react-codemirror - React component of CodeMirror.
* react-pure-render - Better version of shouldComponentUpdate ( [detail](https://facebook.github.io/react/docs/pure-render-mixin.html) )
* react-redux - Architecture stuff.
* react-router - Routing.
* redux - Architecture stuff.
* whatwg-fetch - Polyfill of window.fetch (available after Chrome 39)


## Terminology
* PB - Page break
* doc - Document, each document can have several pages and user import ONE document at each time.

## Wiki
* [Package Import Rules](https://github.com/kmsheng/ketaka-lite/wiki/Package-Import-Rules)
