#!/bin/bash

ELECTRON_VERSION=0.36.9
PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | xargs)
ROOT_DIR=$(cd $(dirname $0)/..; pwd)

cd $ROOT_DIR
rm -rf dist
mkdir -p dist
mkdir -p zips
NODE_ENV=production webpack
sed -i '' -e 's/http:\/\/localhost:3000\///g' dist/index.html
cp -r assets/images/*.ico assets/images/*.icns .babelrc package.json index.js main.js main dist/

cd dist
npm install

if [ "$APP_PLATFORM" == "win32-ia32" ]; then
  electron-packager ./ KETAKA-Lite --platform=win32 --arch=ia32 --version="${ELECTRON_VERSION}" --app-version="${PACKAGE_VERSION}" --icon=treasure_logo.ico
  7z -a -tzip -r "./../zips/KETAKA-Lite-win32-ia32-v${PACKAGE_VERSION}.zip" KETAKA-Lite-win32-ia32
  rm -rf KETAKA-Lite-win32-ia32*
fi

if [ "$APP_PLATFORM" == "win32-x64" ]; then
  electron-packager ./ KETAKA-Lite --platform=win32 --arch=x64 --version="${ELECTRON_VERSION}" --app-version="${PACKAGE_VERSION}" --icon=treasure_logo.ico
  7z -a -tzip -r "./../zips/KETAKA-Lite-win32-x64-v${PACKAGE_VERSION}.zip" KETAKA-Lite-win32-x64
  rm -rf KETAKA-Lite-win32-x64*
fi

if [ "$APP_PLATFORM" == "darwin" ]; then
  electron-packager ./ KETAKA-Lite --platform=darwin --arch=x64 --version="${ELECTRON_VERSION}" --app-version="${PACKAGE_VERSION}" --icon=treasure_logo.icns
  zip -r "./../zips/KETAKA-Lite-darwin-x64-v${PACKAGE_VERSION}.zip" KETAKA-Lite-darwin-x64
  rm -rf KETAKA-Lite-darwin-x64
fi
