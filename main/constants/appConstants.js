import Path from 'path';
import {app} from 'electron';

const appPath = Path.resolve(app.getPath('appData'), 'ketaka-lite');

export const PATH_APP = appPath;
export const PATH_APP_DOC = Path.resolve(appPath, 'docs');
export const PATH_APP_CACHE = Path.resolve(app.getPath('userCache'), 'zip-cache');
export const REGEXP_IMAGE = new RegExp('^(\\d+)\\-(\\d+)([abcd])$');
export const REGEXP_PAGE = new RegExp('^(\\d+)\\.(\\d+)([abcd])$');
