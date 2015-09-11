var Path = require('path');
var _ = require('lodash');
var app = require('app');
var fs = require('fs');
var readChunk = require('read-chunk');
var Helper = require('./Helper');
var Doc = require('./Doc');

var constants = require('../constants');
var PATH_APP_CACHE = constants.PATH_APP_CACHE;
var PATH_APP_DOC = constants.PATH_APP_DOC;
var REGEXP_IMAGE = constants.REGEXP_IMAGE;

function isDirectory(row) {
  return row.stats.isDirectory();
}

function isFile(row) {
  return row.stats.isFile();
}

function isSupportedType(row) {
  var stats = row.stats;
  return stats.isFile() || stats.isDirectory();
}

function scanPaths(rows) {

  var dirPaths = _.chain(rows).filter(isDirectory).pluck('path').value();

  return Helper.readDirs(dirPaths)
    .then(function(subpaths) {
      return Helper.getPathsType(_.flatten(subpaths, true));
    })
    .then(function(subrows) {
      return rows.concat(subrows);
    });
}

function markSupportedRows(rows) {
  return rows.map(function(row) {
    row.isSupportedType = isSupportedType(row);
    return row;
  });
}

function markFileType(rows) {
  return rows.map(function(row) {
    if (row.stats.isFile()) {
      row.fileType = Helper.getFileType(row.path);
    }
    return row;
  });
}

function createPagesByCsvData(csvData) {
  return _.map(csvData, function(arr) {
    return Doc.createPage({
      name: _.get(arr, 0),
      content: _.get(arr, 1)
    });
  });
}

function findPbFile(rows, bambooName) {
  return _.chain(rows)
    .filter(isValidPbFile)
    .find(pbRowWithBambooName.bind(null, bambooName))
    .value();
}

function findTextRow(rows, bambooName) {
  return _.chain(rows)
    .filter(isValidTextRow)
    .find(textRowWithBambooName.bind(null, bambooName))
    .value();
}

function imageFileWithBambooName(bambooName, row) {
  return _.isObject(row.pathData) ? (bambooName === _.get(REGEXP_IMAGE.exec(row.pathData.name), 1)) : false;
}

function pbRowWithBambooName(bambooName, row) {
  return _.isObject(row.pathData) ? (row.pathData.name === bambooName) : false;
}

function textRowWithBambooName(bambooName, row) {
  return _.isObject(row.pathData) ? (row.pathData.name === bambooName) : false;
}

function filterImageRows(rows, bambooName) {
  return _.chain(rows)
    .filter(isValidImageFileType)
    .filter(imageFileWithBambooName.bind(null, bambooName))
    .value();
}

function createPagesByImageRows(bambooName, imageRows) {
  if (_.isEmpty(imageRows)) {
    return [];
  }
  return _.map(imageRows, function(row) {
    return Doc.createPage({
      name: Doc.getPageNameByImageFilename(row.pathData.name),
      imagePath: row.path
    });
  });
}

function createPagesByPbRow(pbRow) {

  if (! pbRow) {
    return [];
  }

  return Helper.readFile(pbRow.path)
    .then(function(csvBuffer) {
      return Helper.parseCsvBuffer(csvBuffer);
    })
    .then(function(csvData) {
      return createPagesByCsvData(csvData);
    });
}

function createChunkByTextRow(textRow) {
  if (! textRow) {
    return null;
  }
  return Helper.readFile(textRow.path)
    .then(function(buffer) {
      return buffer.toString();
    });
}

function mergePages(pbPages, imagePages) {

  var pages = [].concat(pbPages);

  _.each(imagePages, function(page) {
    var existedPbPage = _.find(pbPages, {name: page.name});
    if (existedPbPage) {
      existedPbPage.imagePath = page.imagePath;
    }
    else {
      pages.push(page);
    }
  });

  return pages;
}

function createDocByRows(bambooName, rows) {

  var doc;
  var promises = [];
  var pbRow = findPbFile(rows, bambooName);
  var imageRows = filterImageRows(rows, bambooName);
  var textRow = findTextRow(rows, bambooName);

  promises.push(createPagesByPbRow(pbRow));
  promises.push(createPagesByImageRows(bambooName, imageRows));

  return Doc.getDoc(bambooName)
    .then(function(data) {

      if (data) {
        doc = data;
      }
      else {
        doc = Doc.createDoc({name: bambooName});
        doc.pages.push(Doc.createPage());
      }

      return Promise.all(promises);
    })
    .then(function(sets) {
      return _.spread(mergePages)(sets);
    })
    .then(function(pages) {
      if (pages.length > 0) {
        doc.pages = pages;
      }
    })
    .then(function() {
      return createChunkByTextRow(textRow);
    })
    .then(function(chunk) {
      doc.chunk = chunk;
      return doc;
    });
}

function copyImages(doc) {

  var folderPath = Path.resolve(PATH_APP_DOC, doc.name, 'images');

  doc.pages = doc.pages.map(function(page) {
    if (page.imagePath.length > 0) {
      var pathData = Path.parse(page.imagePath);
      page.destImagePath = Path.resolve(folderPath, pathData.base);
    }
    return page;
  });

  var files = doc.pages.filter(function(page) {
    return page.imagePath.length > 0;
  }).map(function(page) {
    return {
      source: page.imagePath,
      dest: page.destImagePath
    };
  });

  return Helper.mkdirp(folderPath)
    .then(function() {
      return Helper.copyFiles(files);
    })
    .then(function() {
      return doc;
    });
};

function warnInvalidImages(bambooName, rows, onProgress) {
  var rowsWithExtJpg = rows.filter(function(row) {
    return '.jpg' === row.pathData.ext;
  });
  var messages = [];
  rowsWithExtJpg.forEach(function(row) {
    if (! isValidImageFileType(row)) {
      var fileType = _.get(row, 'fileType.mime');
      messages.push({type: 'warning', message: 'Ignore image ' +
        row.pathData.base + ' with an invalid file type ' + fileType});
    }
    else if (! imageFileWithBambooName(bambooName, row)) {
      messages.push({type: 'warning', message: 'Ignore image ' +
        row.pathData.basename + ' which doesn\'t match bamboo name ' + bambooName});
    }
  });
  if (messages.length > 0) {
    onProgress(messages);
  }
}

function isZipUpload(paths) {
  return ('.zip' === Path.extname(_.first(paths))) && (1 === paths.length);
}

function getJsonFileFromVinylFiles(files) {
  return _.find(files, function(file) {
    return file.path.match(/\/([a-zA-Z0-9]+\.json)$/);
  });
}

function handleZipPaths(paths, override) {

  var zipPath = _.first(paths);
  var bambooName;

  return Helper.unzip(zipPath, PATH_APP_CACHE)
    .then(function(files) {

      var jsonFile = getJsonFileFromVinylFiles(files);

      if (! jsonFile) {
        throw 'JSON file is missing.';
      }

      bambooName = Path.basename(jsonFile.path, '.json');

      return Doc.getExistedDocNames()
    })
    .then(function(names) {

      if (-1 !== names.indexOf(bambooName) && (true !== override)) {
        return Promise.reject({type: 'bambooExisted', bambooName: bambooName, paths: paths});
      }
      return Helper.unzip(zipPath, PATH_APP_DOC);
    })
    .then(function(files) {

      var jsonFile = getJsonFileFromVinylFiles(files);

      if (! jsonFile) {
        throw 'JSON file is missing.';
      }
      bambooName = Path.basename(jsonFile.path, '.json');

      Helper.rimraf(Path.resolve(PATH_APP_CACHE, bambooName));

      return Doc.getDoc(bambooName);
    });
}

function handleImportPaths(paths, onProgress, override) {

  onProgress = onProgress || _.noop;

  var bambooName, importedRows;

  if (_.isEmpty(paths)) {
    return Promise.resolve([]);
  }

  if (isZipUpload(paths)) {
    return handleZipPaths(paths, override);
  }

  return Helper.getPathsType(paths)
    .then(function(rows) {
      onProgress({progress: 5, type: 'info', message: 'Step1: Scan Paths'});
      return scanPaths(rows);
    })
    .then(function(rows) {
      onProgress({progress: 20, type: 'info', message: 'Step2: Mark Supported Rows'});
      return markSupportedRows(rows);
    })
    .then(function(rows) {
      onProgress({progress: 30, type: 'info', message: 'Step3: Mark Path Data'});
      return markPathData(rows);
    })
    .then(function(rows) {
      onProgress({progress: 50, type: 'info', message: 'Step4: Mark File Type'});
      return markFileType(rows);
    })
    .then(function(rows) {
      onProgress({progress: 60, type: 'info', message: 'Step5: Find Bamboo Name'});
      bambooName = getBambooName(rows);

      if (! bambooName) {
        onProgress({type: 'danger', message: 'Unable to find bamboo name'});
        return Promise.reject('unable to find bamboo name');
      }
      onProgress({type: 'info', message: 'Found bamboo name: ' + bambooName});

      warnInvalidImages(bambooName, rows, onProgress);

      importedRows = rows;

      return Doc.getExistedDocNames();
    })
    .then(function(names) {

      if (-1 !== names.indexOf(bambooName) && (true !== override)) {
        return Promise.reject({type: 'bambooExisted', bambooName: bambooName, paths: paths});
      }

      onProgress({progress: 70, type: 'info', message: 'Step6: Create Bamboo By Imported Rows'});
      return createDocByRows(bambooName, importedRows);
    })
    .then(function(doc) {
      onProgress({progress: 80, type: 'info', message: 'Step7: Copy Images'});
      return copyImages(doc);
    })
    .then(function(doc) {
      onProgress({progress: 95, type: 'info', message: 'Step8: Write Bamboo'});
      return Doc.writeDoc(doc);
    });
}

function findBambooName(row) {

  if (isValidPbFile(row)) {
    return row.pathData.name;
  }
  if (isValidTextRow(row)) {
    return row.pathData.name;
  }
  if (isValidImageFileType(row)) {
    return _.get(REGEXP_IMAGE.exec(row.pathData.name), 1);
  }
  return null;
}

function getBambooName(rows) {

  var dirRow = _.chain(rows).filter(isDirectory).first().value();

  if (dirRow) {
    return _.last(dirRow.path.split(Path.sep));
  }

  // find the name by occurrence
  return _.chain(rows)
    .map(findBambooName)
    .filter(_.isString)
    .countBy()
    .pairs()
    .sortBy(1)
    .reverse()
    .pluck(0)
    .first()
    .value();
}

function isValidImageFileType(row) {
  var pathData = _.get(row, 'pathData', {});
  return row.stats.isFile() && ('.jpg' === pathData.ext) && REGEXP_IMAGE.test(pathData.name) && ('image/jpeg' === _.get(row, 'fileType.mime'));
}

function isValidPbFile(row) {
  var pathData = row.pathData;
  return row.stats.isFile() && ('.csv' === pathData.ext);
}

function isValidTextRow(row) {
  var pathData = row.pathData;
  return row.stats.isFile() && ('.txt' === pathData.ext);
}

function markPathData(rows) {
  return rows.map(function(row) {
    row.pathData = Path.parse(row.path);
    return row;
  });
}

module.exports = {
  handleImportPaths: handleImportPaths
};
