#!/bin/bash

ROOT_DIR=$(cd $(dirname $0)/..; pwd)
cd $ROOT_DIR

mkdir -p dist
NODE_ENV=production webpack
sed -i '' -e 's/http:\/\/localhost:3000\///g' dist/index.html
cp -r package.json main.js main dist/

cd dist
npm install --verbose --production
