var Path = require('path');
var app = require('app');

var appPath = Path.resolve(app.getPath('appData'), 'ketaka-lite');

module.exports = {
  PATH_APP: appPath,
  PATH_APP_DOC: Path.resolve(appPath, 'docs'),
  REGEXP_IMAGE: new RegExp('^(.+)-(\\d+)-(\\d+)([abcd]+)$'),
  REGEXP_PB: new RegExp('^(.+)_PB$'),
  REGEXP_RTF: new RegExp('^(.+)_RTF$')
};
