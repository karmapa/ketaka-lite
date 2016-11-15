import Path from 'path';
import {app} from 'electron';

export const PATH_APP = Path.resolve(app.getPath('appData'), 'ketaka-lite');
export const PATH_APP_DOC = Path.resolve(PATH_APP, 'docs');
export const PATH_APP_CACHE = Path.resolve(app.getPath('userCache'), 'zip-cache');
export const REGEXP_IMAGE = new RegExp('^(\\d+[abcde]?)\\-(\\d+)([abcd])$');
export const REGEXP_PAGE = new RegExp('^(\\d+)\\-(\\d+)\\-(\\d+)([abcd])?$');
export const VALID_IMAGE_EXTENSIONS = ['bmp', 'gif', 'jpg', 'png'];
