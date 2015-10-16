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
var REGEXP_PAGE = constants.REGEXP_PAGE;

var htmlparser = require('htmlparser');

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

function pluckDirPaths(rows) {
  return _.chain(rows).remove(isDirectory)
    .pluck('path')
    .value();
}

function scanPaths(rows) {

  var dirPaths = pluckDirPaths(rows);

  if (_.isEmpty(dirPaths)) {
    return rows;
  }

  return Helper.readDirs(dirPaths)
    .then(function(subpaths) {
      return Helper.getPathsType(_.flatten(subpaths, true));
    })
    .then(function(subrows) {
      return scanPaths(rows.concat(subrows));
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

function findPbRows(rows) {
  return rows.filter(isValidPbFile);
}

function findTextRow(rows) {
  return rows.filter(isValidTextRow);
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
  return rows.filter(isValidImageFileType);
}

function createPagesByImageRows(imageRows) {
  if (_.isEmpty(imageRows)) {
    return [];
  }
  return Doc.sortPages(_.map(imageRows, function(row) {
    return Doc.createPage({
      name: Doc.getPageNameByImageFilename(row.pathData.name),
      imagePath: row.path
    });
  }));
}

function createPagesByPbContent(content, pathData) {

  return new Promise(function(resolve, reject) {

    var parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(err, dom) {

      if (err) {
        return reject(error);
      }

      var pages = [];
      var currentPage = null;

      dom.forEach(function(node) {
        if (isPbNode(node)) {
          currentPage = Doc.createPage({
            name: node.attribs.id,
            content: '',
            pathData: pathData
          });
          pages.push(currentPage);
        }
        if (isTextNode(node) && currentPage) {
          currentPage.content += node.data;
        }
      });
      resolve(pages);
    }));
    parser.parseComplete(content);
  });
}

function isPbNode(node) {
  return ('tag' === node.type) && ('pb' === node.name);
}

function isTextNode(node) {
  return 'text' === node.type;
}

function createPagesByPbRows(pbRows) {

  if (_.isEmpty(pbRows)) {
    return [];
  }

  var paths = _.pluck(pbRows, 'path');
  var pathDataSets = _.pluck(pbRows, 'pathData');

  return Helper.readFiles(paths)
    .then(function(contents) {
      var promises = contents.map(function(content, index) {
        return createPagesByPbContent(content, pathDataSets[index]);
      });
      return Promise.all(promises);
    })
    .then(function(pages) {
      return _.flatten(pages);
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

function getDuplicatedPbPages(pbPages) {
  var usedNames = [];
  var references = [];
  var duplicatedPbPages = [];

  pbPages.forEach(function(page) {

    var name = page.name;
    var index = usedNames.indexOf(name);
    var notFound = -1 === index;

    if (notFound) {
      usedNames.push(name);
    }
    else {
      if (! _.find(references, {name: page.name})) {
        references.push({
          name: page.name,
          base: page.pathData.base
        });
      }
      duplicatedPbPages.push({
        name: page.name,
        base: page.pathData.base
      });
    }
  });

  duplicatedPbPages = references.concat(duplicatedPbPages);
  return Doc.sortPages(duplicatedPbPages);
}

function warnDuplicatePbPages(onProgress, duplicatedPbPages) {
  if (duplicatedPbPages.length > 0) {
    var messages = duplicatedPbPages.map(function(page) {
      return {
        type: 'warning',
        message: page.name + ' in ' + page.base + ' duplicated.'
      };
    });
    onProgress(messages);
    throw 'Import failed';
  }
}

function mergePages(onProgress, textContent, pbPages, imagePages) {

  imagePages = Doc.sortPages(imagePages);
  pbPages = Doc.sortPages(pbPages);

  var hasPbs = pbPages.length > 0;
  var hasImages = imagePages.length > 0;
  var hasRawText = _.isString(textContent);

  warnDuplicatePbPages(onProgress, getDuplicatedPbPages(pbPages));

  // https://github.com/karmapa/ketaka-lite/wiki/Package-Import-Rules
  // type A: text file only
  if (hasRawText && (! hasPbs) && (! hasImages)) {
    return [Doc.createPage({
      name: 'txt',
      content: textContent
    })];
  }

  // type B: image files only
  if ((! hasRawText) && (! hasPbs) && hasImages) {
    return imagePages;
  }

  // type C: raw text file and image files
  if (hasRawText && (! hasPbs) && hasImages) {
    _.first(imagePages).content = textContent;
    return imagePages;
  }

  // type D: PB files only
  if ((! hasRawText) && hasPbs && (! hasImages)) {
    return pbPages;
  }

  // type E: PB files and images
  if ((! hasRawText) && hasPbs && hasImages) {

    imagePages.forEach(function(page) {
      var name = page.name;
      var pbPage = _.find(pbPages, {name: name});
      if (pbPage) {
        page.content = pbPage.content;
        _.remove(pbPages, {name: name});
      }
    });
    return Doc.sortPages(imagePages.concat(pbPages));
  }

  // type F: PB files and text file
  if (hasRawText && hasPbs && (! hasImages)) {
    return pbPages;
  }

  // type G: PB files and text file
  if (hasRawText && hasPbs && hasImages) {

    imagePages.forEach(function(page) {
      var name = page.name;
      var pbPage = _.find(pbPages, {name: name});
      if (pbPage) {
        page.content = pbPage.content;
        _.remove(pbPages, {name: name});
      }
    });
    return Doc.sortPages(imagePages.concat(pbPages));
  }
}

function readTextRow(row) {
  if (! row) {
    return Promise.resolve(null);
  }
  return Helper.readFile(row.path)
    .then(function(buffer) {
      return buffer.toString();
    });
}

function createDocByRows(bambooName, rows, onProgress) {

  var doc;
  var promises = [];

  var textRow = _.first(findTextRow(rows, bambooName));
  var pbRows = findPbRows(rows);
  var imageRows = filterImageRows(rows, bambooName);

  return Doc.getDoc(bambooName)
    .then(function(data) {

      doc = data;

      if (! doc) {
        doc = Doc.createDoc({name: bambooName});
      }

      promises.push(readTextRow(textRow).then(function(content) {
        doc.chunk = content;
        return content;
      }));
      promises.push(createPagesByPbRows(pbRows));
      promises.push(createPagesByImageRows(imageRows));

      return Promise.all(promises);
    })
    .then(function(sets) {
      return _.spread(mergePages.bind(null, onProgress))(sets);
    })
    .then(function(pages) {

      if (0 === pages.length) {
        throw 'Import failed';
      }
      doc.pages = pages;
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

  var bambooName;

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
      onProgress({progress: 60, type: 'info', message: 'Step5: Generate Bamboo Name'});
      importedRows = rows;
      return Doc.findUniqueUntitledName();
    })
    .then(function(bambooName) {
      onProgress({progress: 70, type: 'info', message: 'Step6: Create Bamboo By Imported Rows'});
      warnInvalidImages(bambooName, importedRows, onProgress);
      return createDocByRows(bambooName, importedRows, onProgress);
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
    return row.pathData.name;
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
  return row.stats.isFile() && ('.jpg' === pathData.ext) && ('image/jpeg' === _.get(row, 'fileType.mime'));
}

function isValidPbFile(row) {
  var pathData = row.pathData;
  return row.stats.isFile() && ('.xml' === pathData.ext);
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
