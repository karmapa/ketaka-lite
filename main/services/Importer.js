let Path = require('path');
let _ = require('lodash');
let app = require('app');
let fs = require('fs');
let readChunk = require('read-chunk');
let Helper = require('./Helper');
let Doc = require('./Doc');

let constants = require('../constants/appConstants');
let PATH_APP_CACHE = constants.PATH_APP_CACHE;
let PATH_APP_DOC = constants.PATH_APP_DOC;
let REGEXP_IMAGE = constants.REGEXP_IMAGE;
let REGEXP_PAGE = constants.REGEXP_PAGE;
let getNonContinuousPageNames = require('./getNonContinuousPageNames');

let htmlparser = require('htmlparser');

function isDirectory(row) {
  return row.stats.isDirectory();
}

function isFile(row) {
  return row.stats.isFile();
}

function isSupportedType(row) {
  let stats = row.stats;
  return stats.isFile() || stats.isDirectory();
}

function pluckDirPaths(rows) {
  return _.chain(rows).remove(isDirectory)
    .pluck('path')
    .value();
}

function scanPaths(rows) {

  let dirPaths = pluckDirPaths(rows);

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

    let parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(err, dom) {

      if (err) {
        return reject(error);
      }

      let pages = [];
      let currentPage = null;
      let nodes = [];

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
          currentPage.content += _.trimLeft(node.data);
        }

        // release memory
        if (isTextNode(node)) {
          node.data = '';
        }
        nodes.push(node);
      });

      resolve({pages, nodes});
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

async function createPagesByPbRows(pbRows) {

  if (_.isEmpty(pbRows)) {
    return [];
  }

  let paths = _.pluck(pbRows, 'path');
  let pathDataSets = _.pluck(pbRows, 'pathData');

  let contents = await Helper.readFiles(paths);

  let promises = contents.map(function(content, index) {
    return createPagesByPbContent(content, pathDataSets[index]);
  });

  let resArr = await Promise.all(promises);
  let pages = _.map(resArr, 'pages');

  return _.flatten(pages);
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
  let usedNames = [];
  let references = [];
  let duplicatedPbPages = [];

  pbPages.forEach(function(page) {

    let name = page.name;
    let index = usedNames.indexOf(name);
    let notFound = -1 === index;

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
    let messages = duplicatedPbPages.map(function(page) {
      return {
        type: 'warning',
        message: page.name + ' in ' + page.base + ' duplicated.'
      };
    });
    onProgress(messages);
    throw 'Import failed';
  }
}

function mergePages(textContent, pbPages, imagePages, onProgress) {

  imagePages = Doc.sortPages(imagePages);
  pbPages = Doc.sortPages(pbPages);

  let hasPbs = pbPages.length > 0;
  let hasImages = imagePages.length > 0;
  let hasRawText = _.isString(textContent);

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
      let name = page.name;
      let pbPage = _.find(pbPages, {name: name});
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
      let name = page.name;
      let pbPage = _.find(pbPages, {name: name});
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

async function createDocByRows(bambooName, rows, onProgress) {

  let textRow = _.first(findTextRow(rows, bambooName));
  let pbRows = findPbRows(rows);
  let imageRows = filterImageRows(rows, bambooName);

  let doc = await Doc.getDoc(bambooName);

  if (! doc) {
    doc = Doc.createDoc({name: bambooName});
  }

  let textContent = await readTextRow(textRow).then(content => {
    doc.chunk = content;
    return content;
  });

  let pbPages = await createPagesByPbRows(pbRows);
  let imagePages = await createPagesByImageRows(imageRows);
  let pages = await mergePages(textContent, pbPages, imagePages, onProgress);

  if (0 === pages.length) {
    throw 'Import failed';
  }

  doc.pages = pages;

  return doc;
}

function copyImages(doc) {

  let folderPath = Path.resolve(PATH_APP_DOC, doc.name, 'images');

  doc.pages = doc.pages.map(function(page) {
    if (page.imagePath.length > 0) {
      page.pathData = Path.parse(page.imagePath);
    }
    return page;
  });

  let files = doc.pages.filter(function(page) {
    return page.imagePath.length > 0;
  }).map(function(page) {
    return {
      source: page.imagePath,
      dest: Path.resolve(folderPath, page.pathData.base)
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

function warnNonContinuousPageNames(names, onProgress) {

  let messages = _.map(getNonContinuousPageNames(names) || [], function(name) {
    return {
      type: 'warning',
      message: name + ' might be missing.'
    };
  })
  if (messages.length > 0) {
    onProgress(messages);
  }
}

function warnInvalidImages(bambooName, rows, onProgress) {
  let rowsWithExtJpg = rows.filter(function(row) {
    return '.jpg' === row.pathData.ext;
  });
  let messages = [];
  rowsWithExtJpg.forEach(function(row) {

    if (! isValidImageFileType(row)) {
      let fileType = _.get(row, 'fileType.mime');
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
    return file.path.match(/([a-zA-Z0-9]+\.json)$/) && file.isBuffer();
  });
}

function handleZipPaths(paths) {

  let zipPath = _.first(paths);
  let bambooName;

  return Helper.unzip(zipPath, PATH_APP_CACHE)
    .then(function(files) {

      let jsonFile = getJsonFileFromVinylFiles(files);

      if (! jsonFile) {
        throw 'JSON file is missing.';
      }

      bambooName = Path.basename(jsonFile.path, '.json');

      return Doc.getExistedDocNames()
    })
    .then(function(names) {
      return Helper.unzip(zipPath, PATH_APP_DOC);
    })
    .then(function(files) {

      let jsonFile = getJsonFileFromVinylFiles(files);

      if (! jsonFile) {
        throw 'JSON file is missing.';
      }
      bambooName = Path.basename(jsonFile.path, '.json');

      Helper.rimraf(Path.resolve(PATH_APP_CACHE, bambooName));

      return Doc.getDoc(bambooName);
    });
}

function handleImportZip(paths) {

  if (_.isEmpty(paths)) {
    return Promise.resolve([]);
  }

  return handleZipPaths(paths);
}

function handleImportPaths(paths, onProgress, force) {

  let importedRows;

  force = force || false;
  onProgress = onProgress || _.noop;

  let bambooName;

  if (_.isEmpty(paths)) {
    return Promise.resolve([]);
  }

  return Helper.getPathsType(paths)
    .then(function(rows) {
      onProgress({progress: 5, type: 'info', message: 'Step1: Scan Paths'});
      return scanPaths(rows);
    })
    .then(function(rows) {

      if (_.isEmpty(rows)) {
        throw 'Could not find any files.';
      }
      onProgress({progress: 20, type: 'info', message: 'Step2: Mark Supported Rows'});
      return markSupportedRows(rows);
    })
    .then(function(rows) {

      let fileCount = rows.filter(function(row) {
        return row.stats.isFile();
      }).length;

      if ((fileCount > 800) && (! force)) {
        throw {type: 'fileCountWarning', fileCount: fileCount};
      }

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

      let pageNames = doc.pages.map(function(page) {
        return page.name;
      })
      .filter(function(name) {
        return name.match(/^(\d+).(\d+)([abcd])$/);
      });
      warnNonContinuousPageNames(pageNames, onProgress);

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

  let dirRow = _.chain(rows).filter(isDirectory).first().value();

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
  let pathData = _.get(row, 'pathData', {});
  return row.stats.isFile() && (-1 !== ['.bmp', '.gif', '.jpg', '.png'].indexOf(pathData.ext));
}

function isValidPbFile(row) {
  let pathData = row.pathData;
  return row.stats.isFile() && ('.xml' === pathData.ext);
}

function isValidTextRow(row) {
  let pathData = row.pathData;
  return row.stats.isFile() && ('.txt' === pathData.ext);
}

function markPathData(rows) {
  return rows.map(function(row) {
    row.pathData = Path.parse(row.path);
    return row;
  });
}

async function addPbFiles(doc, paths) {

  let rows = await Helper.getPathsType(paths);

  rows = await scanPaths(rows);
  rows = await markPathData(rows);

  let pbRows = findPbRows(rows);
  let pbPages = await createPagesByPbRows(pbRows);

  if (_.isEmpty(pbPages)) {
    throw 'Could not find any PB files.';
  }

  doc.pages.forEach(function(page) {
    let name = page.name;
    let newPage = _.find(pbPages, {name: name});
    if (newPage) {
      page.content = newPage.content;
      _.remove(pbPages, {name: name});
    }
  });
  doc.pages = Doc.sortPages(doc.pages.concat(pbPages));

  return doc;
}

module.exports = {
  handleImportPaths: handleImportPaths,
  handleImportZip: handleImportZip,
  addPbFiles: addPbFiles
};
