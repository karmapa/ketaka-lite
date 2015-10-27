var constants = require('../constants');

var REGEXP_IMAGE = constants.REGEXP_IMAGE;
var PATH_APP_DOC = constants.PATH_APP_DOC;
var REGEXP_PAGE = constants.REGEXP_PAGE;

var Helper = require('./Helper');
var Path = require('path');
var _ = require('lodash');
var uuid = require('node-uuid');
var zpad = require('zpad');
var mkdirp = require('mkdirp');

function createDoc(args) {
  return _.extend({
    uuid: uuid.v4(),
    name: '',
    pageIndex: 0,
    editChunk: false,
    pages: [],
    chunk: ''
  }, args);
}

function createPage(args) {
  return _.extend({
    name: '',
    content: '',
    imagePath: '',
    destImagePath: '',
    pathData: '',
    config: {}
  }, args);
}

function getDoc(name) {
  var path = Path.resolve(PATH_APP_DOC, name, name + '.json');
  return Helper.readFile(path)
    .then(function(json) {
      return JSON.parse(json);
    })
    .catch(function() {
      return null;
    });
}

function getImageFilenameByDoc(doc) {
  var page = doc.pages[doc.pageIndex];
  return doc.name + '-' + page.name.replace(/(\d+)\.(\d+)/, function(all, volume, page) {
    return zpad(volume, 3) + '-' + zpad(volume, 3);
  }) + '.jpg';
}

function getPageNameByImageFilename(filename) {
  return _.spread(function(all, volume, page, char) {
    if (! all) {
      return Path.basename(filename);
    }
    return parseInt(volume, 10) + '.' + parseInt(page, 10) + char;
  })(REGEXP_IMAGE.exec(filename));
}

function getExistedDocNames() {

  return Helper.readDir(PATH_APP_DOC)
    .then(function(paths) {
      return Helper.getPathsType(paths);
    })
    .then(function(rows) {
      return rows.filter(function(row) {
        return row.stats.isDirectory();
      })
      .map(function(row) {
        return Path.basename(row.path);
      });
    });
}

function isDocNameExisted(name) {
  return getExistedDocNames()
    .then(function(names) {
      return -1 !== names.indexOf(name);
    });
}

function findUniqueUntitledName() {

  var name = 'untitled';

  return getExistedDocNames()
    .then(function(existedNames) {
      var index = 0;
      while (-1 !== existedNames.indexOf(name)) {
        name = 'untitled' + (++index);
      }
      return name;
    });
}

function writeDoc(doc) {
  var path = Path.resolve(PATH_APP_DOC, doc.name, doc.name + '.json');
  var content = JSON.stringify(doc);

  return Helper.writeFile(path, content)
    .then(function() {
      return doc;
    });
}

function replaceImageName(bambooName, path) {
  basename = Path.basename(path);
  return basename.replace(/^(.+)\-(\d+)\-(\d+[abcd]).jpg/g, function(all, name, volume, pageName) {
    return [bambooName, volume, pageName].join('-') + '.jpg';
  });
}

function getNewIndexByPageName(pages, pageName) {
  return pages.map(function(page) {
    return page.name;
  })
  .indexOf(pageName);
}

function changeDocSettings(args) {

  var doc = args.doc;
  var oldDocName = args.oldDocName;
  var docName = args.docName;
  var oldPageName = args.oldPageName;
  var pageName = args.pageName;

  var oldPath = Path.resolve(PATH_APP_DOC, oldDocName);
  var oldImagePath = Path.resolve(oldPath, 'images');
  var path = Path.resolve(PATH_APP_DOC, docName);
  var imagePath = Path.resolve(path, 'images');

  var oldJsonPath = Path.resolve(oldPath, oldDocName + '.json');
  var newJsonPath = Path.resolve(path, docName + '.json');

  // only change page name
  if ((docName === oldDocName) && (pageName !== oldPageName)) {

    var page = _.find(doc.pages, {name: oldPageName});

    if (page) {
      page.name = pageName;
    }

    doc.pages = sortPages(doc.pages);
    doc.pageIndex = getNewIndexByPageName(doc.pages, pageName);

    return Helper.writeFile(newJsonPath, JSON.stringify(doc))
      .then(function() {
        return doc;
      });
  }

  if (docName !== oldDocName) {
    // create new folder
    return Helper.mkdirp(imagePath)
      .then(function() {
        // write new json
        doc.name = docName;
        doc.pages.map(function(page) {

          // replace new page name
          if (page.name === oldPageName) {
            page.name = pageName;
          }

          // replace image paths
          if (page.destImagePath) {
            var newBasename = replaceImageName(docName, page.destImagePath);
            page.destImagePath = Path.resolve(imagePath, newBasename);
          }
          return page;
        });
        doc.pages = sortPages(doc.pages);
        doc.pageIndex = getNewIndexByPageName(doc.pages, pageName);

        return Helper.writeFile(newJsonPath, JSON.stringify(doc));
      })
      .then(function() {
        return Helper.readDir(oldImagePath);
      })
      .then(function(subImagePaths) {
        // move image files
        var rows = subImagePaths.map(function(subImagePath) {
          var newBasename = replaceImageName(docName, subImagePath);
          var newSubImagePath = Path.resolve(imagePath, newBasename);
          return {
            source: subImagePath,
            dest: newSubImagePath
          };
        });
        return Helper.copyFiles(rows);
      })
      .then(function() {
        // remove old doc path
        return Helper.rimraf(oldPath);
      })
      .then(function() {
        return doc;
      });
  }
}

function sortPages(pages) {

  var validPages = _.filter(pages, function(page) {
    return REGEXP_PAGE.exec(page.name);
  });

  validPages = validPages.sort(function(a, b) {

    var aRes = REGEXP_PAGE.exec(a.name);
    var aFirstNumber = parseInt(aRes[1], 10);
    var aSecondNumber = parseInt(aRes[2], 10);
    var aChar = aRes[3];

    var bRes = REGEXP_PAGE.exec(b.name);
    var bFirstNumber = parseInt(bRes[1], 10);
    var bSecondNumber = parseInt(bRes[2], 10);
    var bChar = bRes[3];

    if (aFirstNumber > bFirstNumber) {
      return 1;
    }

    if (bFirstNumber < bFirstNumber) {
      return -1;
    }

    if (aSecondNumber > bSecondNumber) {
      return 1;
    }

    if (aSecondNumber < bSecondNumber) {
      return -1;
    }

    if (aChar > bChar) {
      return 1;
    }

    if (aChar < bChar) {
      return -1;
    }
    return 0;
  });

  var invalidPages = _.filter(pages, function(page) {
    return ! REGEXP_PAGE.exec(page.name);
  });

  invalidPages = invalidPages.sort(function(a, b) {
    return a.name > b.name;
  });

  return validPages.concat(invalidPages);
}

function genPbFileContent(doc) {
  return doc.pages.map(function(page) {
    return '<pb id="' + page.name + '" />\n' + page.content + '\n';
  }).join('');
}

module.exports = {
  createDoc: createDoc,
  createPage: createPage,
  changeDocSettings: changeDocSettings,
  findUniqueUntitledName: findUniqueUntitledName,
  getDoc: getDoc,
  genPbFileContent: genPbFileContent,
  getImageFilenameByDoc: getImageFilenameByDoc,
  getPageNameByImageFilename: getPageNameByImageFilename,
  getExistedDocNames: getExistedDocNames,
  sortPages: sortPages,
  writeDoc: writeDoc
};
