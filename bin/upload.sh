#!/bin/bash

set -x

PACKAGE_NAME=$(cat package.json | grep name | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | xargs)
PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | xargs)
ZIP_IOS="${PACKAGE_NAME}-darwin-x64-v${PACKAGE_VERSION}.zip"

if [ "$APP_PLATFORM" == "darwin" ]; then
  aws s3 cp "./zips/${ZIP_IOS}" s3://ketaka-lite-download/
fi
