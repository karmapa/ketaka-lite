import StreamZip from 'node-stream-zip';
import {clone} from 'lodash';

let BufferHelper = require('bufferhelper');
let Path = require('path');
let csv = require('csv');
let fileType = require('file-type');
let fs = require('fs-extra');
let mkdirp = require('mkdirp');
let readChunk = require('read-chunk');
let rimraf = require('rimraf');

function isDarwin() {
  return 'darwin' === process.platform;
}

function chunkString(str, length) {
  return str.match(new RegExp('[\\S\\s]{1,' + length + '}', 'g'));
}

function copy(source, dest) {
  return new Promise(function(resolve, reject) {
    fs.copy(source, dest, function(err) {
      return err ? reject(err) : resolve();
    });
  });
}

function copyFile(source, dest) {
  return new Promise(function(resolve, reject) {

    let writeStream = fs.createWriteStream(dest);

    fs.createReadStream(source)
      .pipe(writeStream)
      .on('error', function(err) {
        reject('copyFile failed');
      });

    writeStream.on('close', function() {
      resolve();
    });
  });
}

function copyFiles(rows) {
  return new Promise(function(resolve, reject) {

    (function recurse() {
      let row = rows.pop();

      if (! row) {
        resolve();
      }
      return copyFile(row.source, row.dest)
        .then(function() {
          return recurse();
        })
        .catch(function(err) {
          return reject(err);
        });
    })();
  });
}

function getFileType(path) {
  return fileType(readChunk.sync(path, 0, 262)) || {};
}

function recursiveCreateFolder(path) {
  return new Promise(function(resolve, reject) {
    mkdirp(path, function(err) {
      return err ? reject(err) : resolve();
    });
  });
}

function readFile(path) {
  return new Promise(function(resolve, reject) {

    let data = [];
    let bufferHelper = new BufferHelper();

    fs.createReadStream(path)
      .on('data', function(chunk) {
        bufferHelper.concat(chunk);
      })
      .on('error', function(err) {
        reject('readFile failed');
      })
      .on('end', function() {
        resolve(bufferHelper.toBuffer());
      });
  });
}

function readFiles(paths) {

  let index = -1;
  let contents = [];

  return new Promise(function(resolve, reject) {

    (function recurse() {
      let path = paths[++index];
      if (! path) {
        resolve(contents);
      }
      return readFile(path)
        .then(function(content) {
          contents.push(content);
          return recurse();
        })
        .catch(function(err) {
          return reject(err);
        });
    })();
  });
}

function writeFile(path, content) {
  return new Promise(function(resolve, reject) {

    let writeStream = fs.createWriteStream(path)
      .on('finish', function() {
        resolve();
      })
      .on('error', function(err) {
        reject('writeFile failed' + err.toString());
      });

    writeStream.write(content);
    writeStream.end();
  });
}

function getPathsType(paths) {

  let rows = [];
  let clonedPaths = clone(paths);

  return new Promise(function(resolve, reject) {

    (function recurse() {
      let path = clonedPaths.pop();

      if (! path) {
        resolve(rows);
      }
      return getPathType(path)
        .then(function(row) {
          rows.push(row);
          return recurse();
        })
        .catch(function(err) {
          reject(err);
        });
    })();
  });
}

function getPathType(path) {
  return new Promise(function(resolve, reject) {
    fs.lstat(path, function(err, stats) {
      return err ? reject('getPathType failed') : resolve({path: path, stats: stats});
    });
  });
}

function parseCsvBuffer(buffer) {
  return new Promise(function(resolve, reject) {
    csv.parse(buffer, function(err, data) {
      return err ? reject('parseCsvBuffer failed') : resolve(data);
    });
  });
}

function readDir(path) {
  return new Promise(function(resolve, reject) {
    fs.readdir(path, function(err, paths) {
      if (err) {
        return reject('readDir failed');
      }
      resolve(paths.map(function(subpath) {
        return Path.join(path, subpath);
      }));
    });
  });
}

function readDirs(paths) {

  let sets = [];

  return new Promise(function(resolve, reject) {

    (function recurse() {
      let path = paths.pop();

      if (! path) {
        resolve(sets);
      }
      return readDir(path)
        .then(function(subPaths) {
          sets.push(subPaths);
          return recurse();
        })
        .catch(function(err) {
          return reject(err);
        });
    })();
  });
}

function recursiveRemove(path) {
  return new Promise(function(resolve, reject) {
    rimraf(path, function(err) {
      return err ? reject(err) : resolve();
    });
  });
}

function readZip(path) {

  return new Promise((resolve, reject) => {
    const zip = new StreamZip({
      file: path,
      storeEntries: true
    });

    const entries = [];

    zip.on('entry', entry => entries.push(entry));
    zip.on('ready', () => resolve(entries));
  });
}

function unzip(path, dest, onExtract = () => {}) {

  return new Promise(function(resolve, reject) {

    let extractedCount = 0;

    const zip = new StreamZip({
      file: path,
      storeEntries: true
    });

    zip.on('ready', () => {
      zip.extract(null, dest, (err, count) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(zip.entries());
        }
      });
    });

    zip.on('extract', function(entry, file) {
      onExtract({
        entriesCount: zip.entriesCount,
        extractedCount: ++extractedCount,
        entry,
        file
      });
    });
  });
}

module.exports = {
  chunkString: chunkString,
  copy: copy,
  copyFile: copyFile,
  copyFiles: copyFiles,
  getFileType: getFileType,
  getPathType: getPathType,
  getPathsType: getPathsType,
  isDarwin: isDarwin,
  mkdirp: recursiveCreateFolder,
  parseCsvBuffer: parseCsvBuffer,
  readDir: readDir,
  readDirs: readDirs,
  readZip,
  readFile: readFile,
  readFiles: readFiles,
  rimraf: recursiveRemove,
  unzip: unzip,
  writeFile: writeFile
};
