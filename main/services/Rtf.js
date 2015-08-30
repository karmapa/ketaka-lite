var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var _ = require('lodash');

function Rtf() {

  // Implementation based on Rich Text Format (RTF) Specification Version 1.9.1

  if (! (this instanceof Rtf)) {
    return new Rtf();
  }

  var self = this;

  var CONTROL_WORDS_START = '{';
  var CONTROL_WORDS_END = '}';

  var CONTROL_DELIMITER = '\\';
  var CONTROL_RTF = '\\rtf1';
  var CONTROL_FONT_TABLE = '\\fonttbl';
  var CONTROL_COLOR_TABLE = '\\colortbl';
  var CONTROL_UNICODE = '\\u';
  var CONTROL_UNICODE_COUNT = '\\uc';
  var CONTROL_FONT = '\\f';
  var CONTROL_COLOR_FOREGROUND = '\\cf';
  var CONTROL_BOLD = '\\b';
  var CONTROL_FONT_SIZE = '\\fs';
  var CONTROL_PARAGRAPH = '\\par ';

  var CONTROLS = [CONTROL_PARAGRAPH, CONTROL_FONT_TABLE, CONTROL_COLOR_TABLE, CONTROL_UNICODE];

  var PARSE_FUNCS = {};
  PARSE_FUNCS[CONTROL_RTF] = 'parseText';
  PARSE_FUNCS[CONTROL_FONT_TABLE] = 'parseFontGroup';
  PARSE_FUNCS[CONTROL_COLOR_TABLE] = 'parseColorGroup';
  PARSE_FUNCS[CONTROL_UNICODE] = 'parseText';
  PARSE_FUNCS[CONTROL_PARAGRAPH] = 'parseParagraph';

  self.decoder = new StringDecoder();

  self.init = function() {
    self.root = self.createNode({name: 'root'});
    self.currentNode = self.root;

    self.fontTable = [];
    self.colorTable = [];
    self.text = '';

    self.cfData = {};
  };

  self.parse = function(data, callback) {

    self.init();

    if (data instanceof Buffer) {
      data = decoder.write(data);
    }
    self.buildNodes(data);

    callback(null, {
      text: self.text,
      config: {cfData: self.cfData}
    });
  };

  self.buildNodes = function(data) {

    var previousChar = '';

    _.each(data, function(char) {

      if (self.nodeStart(char, previousChar)) {
        self.createChild();
        return true;
      }
      if (self.nodeEnd(char, previousChar)) {
        self.currentNode.name = self.findControlName(CONTROLS, self.currentNode.content);
        self.parseNodeContent(self.currentNode);
        self.backToParent();
        return true;
      }
      self.currentNode.content += char;
      previousChar = char;
    });
  };

  self.parseNodeContent = function(node) {

    var args = _.toArray(arguments);
    var func = PARSE_FUNCS[node.name];
    var parseFunc = self[func];

    if (_.isFunction(parseFunc)) {
      parseFunc.apply(self, args);
    }
  };

  self.parseColorGroup = function(node) {

    // {\colortbl;\red255\green255\blue255;}
    var matches = node.content.match(/\\red\d+\\green\d+\\blue\d+/g) || [];

    node.data = matches.map(function(piece, index) {
      var matchedPieces = piece.match(/\\red(\d+)\\green(\d+)\\blue(\d+)/) || [];
      var cfIndex = 'cf' + index;
      return _.object(['cfIndex', 'all', 'red', 'green', 'blue'], [cfIndex].concat(matchedPieces));
    })
    .filter(_.isObject);

    self.colorTable = node.data;
  };

  self.getRowsByName = function(rows, name) {
    return rows.filter(function(row) {
      return row.name === name;
    });
  };

  self.unicodeToChar = function(text) {
    return text.replace(/\\u([\dA-Fa-f]{4})/g, function(all, unicode) {
      return String.fromCharCode(unicode);
    });
  };

  self.createArray = function(obj, prop) {
    if (! _.isArray(obj[prop])) {
      obj[prop] = [];
    }
  };

  self.parseParagraph = function(node) {
    // self.text += '\n';
  };

  self.parseText = function(node) {

    var tokens = node.content.replace('\\\'3f', ' ')
      .split(/[\s|\n]/)
      .filter(function(piece) {
        return piece.length > 0;
      });

    var lastCf = '';
    var currentCfRow = {};

    _.each(tokens, handleToken);

    function handleToken(token, index) {

      if ('\\' === token) {
        if (_.isNull(currentCfRow.to)) {
          currentCfRow.to = self.text.length - 1;
          currentCfRow = {from: null, to: null};
          self.cfData[lastCf].push(currentCfRow);
        }
        self.text += '\n';
        return;
      }

      var cfMatches = token.match(/\\(cf\d+)/);
      var cf = _.get(cfMatches, 1);

      if (cf) {
        if (_.isNull(currentCfRow.end)) {
          currentCfRow.end = self.text.length - 1;
        }
        self.createArray(self.cfData, cf);
        currentCfRow = {from: null, to: null};
        self.cfData[cf].push(currentCfRow);
        lastCf = cf;
        return;
      }

      var unicodeMatches = token.match(/\\u([\dA-Fa-f]{4})/);
      var unicode = _.get(unicodeMatches, 1);

      if (unicode) {
        self.text += String.fromCharCode(unicode);
        if (_.isNull(currentCfRow.from)) {
          currentCfRow.from = self.text.length - 1;
        }
        return;
      }

      self.text += self.cleanControlWords(token)
        .replace(/\\([^\\])/g, '$1')
        .replace('\\', '\n');
    }
  };

  self.cleanControlWords = function(text, keeps) {
    text = text || '';
    keeps = keeps || [];
    return text.replace(/\\[a-z\-]+\d*/g, function(word) {
      return _.any(keeps, function(keep) {
        return -1 !== word.indexOf(keep);
      }) ? word : '';
    });
  };

  self.parseFontGroup = function(node) {

    // Control font table may have two kinds of format:
    //
    // {\fonttbl\f0\fnil\fcharset77 Kailasa;\f1\fswiss\fcharset0 Helvetica;\f2\fnil\fcharset136 STHeitiTC-Light;}
    // or
    // {\fonttbl
    //   {\f0\fbidi \froman\fcharset0\fprq2{\*\panose 02020603050405020304}Times New Roman;}
    //   {\f1\fbidi \fswiss\fcharset0\fprq2{\*\panose 020b0604020202020204}Arial;}
    // }

    if (_.isEmpty(node.children)) {

      var fontInfos = node.content.match(/\\f\d+\\\w+\\fcharset\d+ [\-\w\s]+/g) || [];

      node.data = _.chain(fontInfos)
        .map(function(piece, index) {
          var matches = piece.match(/\\(f\d+)\\(\w+)\\fcharset(\d+) ([\-\w\s]+)/) || [];
          return _.object(['all', 'fontIndex', 'fontFamily', 'charset', 'font'], matches);
        })
        .indexBy('fontIndex')
        .value();

      self.fontTable = node.data;
      return;
    }

    node.data = node.children
      .map(function(row) {
        // \f0\fbidi\froman\fcharset0\fprq2TimesNewRoman;
        // \fbiminor\f31586\fbidi\froman\fcharset163\fprq2TimesNewRomanVietnamese;
        var matches = row.content.match(/\\?(\w+)?\\(f\d+)\\(\w+)\s?\\(\w+)\\fcharset(\d+)\\fprq(\d+)(.+);/) || [];
        return _.object(['all', 'themeFont', 'fontIndex', 'flag', 'fontFamily', 'charset', 'pitch', 'font'], matches);
      });

    self.fontTable = node.data;
  };

  self.findControlName = function(controls, content) {
    return _.find(controls, function(name) {
      return -1 !== content.indexOf(name);
    }) || '';
  };

  self.createNode = function(options) {
    return _.extend({
      name: '',
      content: '',
      children: [],
      parent: null,
      data: null
    }, options);
  };

  self.nodeStart = function(char, previousChar) {
    return (CONTROL_WORDS_START === char) && (CONTROL_DELIMITER !== previousChar);
  };

  self.nodeEnd = function(char, previousChar) {
    return (CONTROL_WORDS_END === char) && (CONTROL_DELIMITER !== previousChar);
  };

  self.createChild = function() {
    var newNode = self.createNode({parent: self.currentNode});
    self.currentNode.children.push(newNode);
    self.currentNode = newNode;
  };

  self.backToParent = function() {
    if (self.currentNode.parent) {
      var node = self.currentNode;
      self.currentNode = node.parent;
      node.parent = null;
    }
  };
}

module.exports = Rtf;
