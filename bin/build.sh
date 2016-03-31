#!/bin/bash

PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g')
ROOT_DIR=$(cd $(dirname $0)/..; pwd)
cd $ROOT_DIR

mkdir -p dist
NODE_ENV=production webpack
sed -i '' -e 's/http:\/\/localhost:3000\///g' dist/index.html
cp -r assets/images/*.ico assets/images/*.icns .babelrc package.json index.js main.js main dist/

cd dist
npm install --verbose --production

ZIP_WIN="KETAKA-Lite-win32-ia32-v${PACKAGE_VERSION}.zip"
ZIP_IOS="KETAKA-Lite-darwin-x64-v${PACKAGE_VERSION}.zip"
FOLDER_ID=0B0sfHY8vpXYhSGVLUmpuQ0JKbEE

electron-packager ./ KETAKA-Lite --platform=win32 --arch=ia32 --version=0.36.9 --icon=treasure_logo.ico &&
zip -r "${ZIP_WIN}" KETAKA-Lite-win32-ia32
gdrive upload "${ZIP_WIN}" -p "${FOLDER_ID}" &&
rm -r KETAKA-Lite-win32-ia32* &&
electron-packager ./ KETAKA-Lite --platform=darwin --arch=x64 --version=0.36.9 --icon=treasure_logo.icns &&
zip -r "${ZIP_IOS}" KETAKA-Lite-darwin-x64 &&
gdrive upload "${ZIP_IOS}" -p "${FOLDER_ID}"
