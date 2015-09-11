var Path = require('path');
var app = require('app');

var appPath = Path.resolve(app.getPath('appData'), 'ketaka-lite');

module.exports = {
  PATH_APP: appPath,
  PATH_APP_DOC: Path.resolve(appPath, 'docs'),
  PATH_APP_CACHE: Path.resolve(app.getPath('userCache'), 'zip-cache'),
  REGEXP_IMAGE: new RegExp('^([a-zA-Z0-9]+)\\-(\\d+)\\-(\\d+)([abcd])$'),
  REGEXP_PAGE: new RegExp('^(\\d+)\\.(\\d+)([abcd])$')
};
