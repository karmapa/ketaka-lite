
var _ = require('lodash');
var compare = require('javascript-natural-sort');
var REGEXP_PAGE = new RegExp('^(\\d+)\\.(\\d+)([abcd])$');

function getNonContinuousPageNames(names) {
  var groups = toGroups(names);
  var missingNames = [];
  missingNames.push(getMissingNamesBySecondNum(groups));
  missingNames.push(getMissingNamesByPairs(groups));

  return  _.chain(missingNames)
    .flatten(missingNames)
    .tap(pairs.bind(names))
    .unique()
    .sort(compare)
    .value();
}

function pairs(originalNames, names) {
  _.each(names, function(name) {
    if ('a' === name.slice(-1)) {
      names.push(name.substring(0, name.length - 1) + 'b');
    }
    if ('b' === name.slice(-1)) {
      names.push(name.substring(0, name.length - 1) + 'a');
    }
    if ('c' === name.slice(-1)) {
      names.push(name.substring(0, name.length - 1) + 'd');
    }
    if ('d' === name.slice(-1)) {
      names.push(name.substring(0, name.length - 1) + 'c');
    }
  });
  return _.without(names, originalNames);
}

function getMissingNamesByPairs(groups) {

  var missingNames = [];

  _.each(groups, function(group) {
    missingNames = missingNames.concat(xor('a', group.a, 'b', group.b))
      .concat(xor('c', group.c, 'd', group.d));
  });

  _.filter(missingNames, _.isEmpty);

  return missingNames;
}

function xor(letterA, arrA, letterB, arrB) {

  var nums = [];

  _.each(arrA, function(rowA) {
    var numA = pureNumber(rowA.name);
    var collectNumber = _.every(arrB, function(rowB) {
      var numB = pureNumber(rowB.name);
      return numA !== numB;
    });
    if (collectNumber) {
      nums.push(numA + letterB);
    }
    if (_.isEmpty(arrB)) {
      nums.push(numA + letterB);
    }
  });

  return nums;
}

function pureNumber(name) {
  return name.substring(0, name.length - 1);
}

function getMissingNamesBySecondNum(groups) {
  var missingNames = [];
  _.each(groups, function(group) {
    _.each(group, function(arr) {

      var lastIndex = arr.length - 1;
      _.each(arr, function(row, index) {
        if (index === lastIndex) {
          return true;
        }
        var nextRow = arr[index + 1];
        var delta = nextRow.secondNum - row.secondNum;
        if (delta > 1) {
          var start = row.secondNum + 1;
          var nums = _.range(start, start + delta - 1)
            .map(function(num) {
              return row.firstNum + '.' + num + row.letter;
            });
          missingNames = missingNames.concat(nums);
        }
      });
    });
  });

  return missingNames;
}

function toGroups(names) {
  return _.chain(names || [])
    .sort(compare)
    .map(toObject)
    .groupBy(_.property('firstNum'))
    .map(function(rows) {

      return _.chain(rows)
        .groupBy(_.property('letter'))
        .tap(function(letterGroups) {
          return ['a', 'b', 'c', 'd'].map(function(letter) {
            var props = {};
            props[letter] = [];
            return _.defaults(letterGroups, props);
          });
        })
        .value();
    })
    .value();
}

function toObject(name) {
  var matches = REGEXP_PAGE.exec(name);
  return {
    name: name,
    firstNum: parseInt(matches[1], 10),
    secondNum: parseInt(matches[2], 10),
    letter: matches[3]
  }
}

module.exports = getNonContinuousPageNames;
