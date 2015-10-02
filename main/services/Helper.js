var BufferHelper = require('bufferhelper');
var Path = require('path');
var csv = require('csv');
var fileType = require('file-type');
var fs = require('fs');
var Decompress = require('decompress');
var mkdirp = require('mkdirp');
var readChunk = require('read-chunk');
var rimraf = require('rimraf');
var _ = require('lodash');

function isDarwin() {
  return 'darwin' === process.platform;
}

function chunkString(str, length) {
  return str.match(new RegExp('[\\S\\s]{1,' + length + '}', 'g'));
}

function copyFile(source, dest) {
  return new Promise(function(resolve, reject) {

    var writeStream = fs.createWriteStream(dest);

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
      var row = rows.pop();

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

    var data = [];
    var bufferHelper = new BufferHelper();

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

  var contents = [];

  return new Promise(function(resolve, reject) {

    (function recurse() {

      var path = paths.pop();
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

    var writeStream = fs.createWriteStream(path)
      .on('finish', function() {
        resolve();
      })
      .on('error', function() {
        reject('writeFile failed');
      });

    writeStream.write(content);
    writeStream.end();
  });
}

function getPathsType(paths) {

  var rows = [];
  var clonedPaths = _.clone(paths);

  return new Promise(function(resolve, reject) {

    (function recurse() {
      var path = clonedPaths.pop();

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

  var sets = [];

  return new Promise(function(resolve, reject) {

    (function recurse() {
      var path = paths.pop();

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

function unzip(path, dest) {

  return new Promise(function(resolve, reject) {
    new Decompress({mode: '755'})
      .src(path)
      .dest(dest)
      .use(Decompress.zip())
      .run(function(err, files) {
        return err ? reject(err) : resolve(files);
      });
  });
}

module.exports = {
  chunkString: chunkString,
  copyFile: copyFile,
  copyFiles: copyFiles,
  getFileType: getFileType,
  getPathType: getPathType,
  getPathsType: getPathsType,
  writeFile: writeFile,
  isDarwin: isDarwin,
  mkdirp: recursiveCreateFolder,
  rimraf: recursiveRemove,
  parseCsvBuffer: parseCsvBuffer,
  readDir: readDir,
  readDirs: readDirs,
  readFile: readFile,
  readFiles: readFiles,
  unzip: unzip
};
