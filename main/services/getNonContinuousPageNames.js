const _ = require('lodash');
const compare = require('javascript-natural-sort');
const REGEXP_PAGE = new RegExp('^(\\d+)\\.(\\d+)([abcd])$');

export default function getNonContinuousPageNames(names) {

  return _.chain(names)
    .sort(compare)
    .map(parse)
    .groupBy(row => row.num1 + '.' + row.num2)
    .reduce((res, arr) => {

      const firstRow = _.first(arr);
      const num = firstRow.num1 + '.' + firstRow.num2;

      let record = arr.reduce((map, row) => {
        map[row.char] = true;
        return map;
      }, {a: false, b: false, c: false, d: false});

      if ((! record.c) && (! record.d)) {
        delete record.c;
        delete record.d;
      }

      _.each(record, (value, char) => {
        if (! record[char]) {
          res.push(num + char);
        }
      });

      return res;
    }, [])
    .value();

  function parse(name) {
    const [all, num1, num2, char] = REGEXP_PAGE.exec(name);
    return {name, num1, num2, char};
  }
}
