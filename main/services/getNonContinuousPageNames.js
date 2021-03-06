import _, {first, each} from 'lodash';
import compare from './compare';
import REGEXP_PAGE from './../constants/regexpPage';

function byCompare(a, b) {
  return compare(a.name, b.name);
}

function hasChar(row) {
  return !! row.char;
}

function parse(name) {
  const [all, num1, num2, num3, char] = REGEXP_PAGE.exec(name);
  return {
    name,
    num1: parseInt(num1, 10),
    num2: parseInt(num2, 10),
    num3: parseInt(num3, 10),
    char
  };
}

function getBreakPoint(row1, row2) {

  const row1Num1 = row1.num1;
  const row1Num2 = row1.num2;
  const row1Num3 = row1.num3;

  const row2Num1 = row2.num1;
  const row2Num2 = row2.num2;
  const row2Num3 = row2.num3;

  // 1-1-1 -> 1-1-2
  if ((row1Num1 === row2Num1) && (row1Num2 === row2Num2) && ((row1Num3 + 1) === (row2Num3))) {
    return null;
  }

  // 1-1-1 -> 1-2-0 or 1-1-2 -> 1-2-0
  if ((row1Num1 === row2Num1) && ((row1Num2 + 1) === row2Num2) && (0 === row2Num3)) {
    return null;
  }

  // 1-1-1 -> 1-2-1 or 1-1-2 -> 1-2-1
  if ((row1Num1 === row2Num1) && ((row1Num2 + 1) === row2Num2) && (1 === row2Num3)) {
    return null;
  }

  // 1-3-4 -> 2-1-1
  if (((row1Num1 + 1) === row2Num1) && (1 === row2Num2) && (1 === row2Num3)) {
    return null;
  }

  return [row1.name, row2.name];
}

function handleRowsWithChar(rows) {

  return _.chain(rows)
    .groupBy(({num1, num2, num3}) => `${num1}-${num2}-${num3}`)
    .reduce((res, arr) => {

      const firstRow = first(arr);
      const {num1, num2, num3} = firstRow;
      const num = `${num1}-${num2}-${num3}`;

      let record = arr.reduce((map, row) => {
        map[row.char] = true;
        return map;
      }, {a: false, b: false, c: false, d: false});

      if ((! record.c) && (! record.d)) {
        delete record.c;
        delete record.d;
      }

      each(record, (value, char) => {
        if (! record[char]) {
          res.result.pageNames.push(num + char);
        }
      });

      const prevRow = first(res.prevArr);

      if (prevRow) {
        const point = getBreakPoint(prevRow, firstRow);
        if (point) {
          res.result.breakPoints.push(point);
        }
      }

      res.prevArr = arr;

      return res;
    }, {
      result: {
        pageNames: [],
        breakPoints: []
      },
      prevArr: null
    })
    .value().result;
}

function handleRowsWithoutChar(rows) {

  return _.chain(rows)
    .reduce((res, row, index, arr) => {
      const prevRow = arr[index - 1];

      if (prevRow) {
        const point = getBreakPoint(prevRow, row);
        if (point) {
          res.breakPoints.push(point);
        }
      }
      return res;
    }, {
      breakPoints: [],
      prevArr: null
    })
    .value().breakPoints;
}

export default function getNonContinuousPageNames(names) {

  const rows = names.map(parse);
  const rowsWithChars = rows.filter(hasChar)
    .sort(byCompare);

  const rowsWithoutChars = rows.filter((name) => (! hasChar(name)))
    .sort(byCompare);

  const res = handleRowsWithChar(rowsWithChars);
  const res2 = handleRowsWithoutChar(rowsWithoutChars);

  const hasMixedPageNames = (rowsWithChars.length > 0) && (rowsWithoutChars.length > 0);
  const mixedStartedIds = hasMixedPageNames ? [first(rowsWithoutChars).name, first(rowsWithChars).name] : [];

  return {
    mixedStartedIds,
    pageNames: res.pageNames,
    breakPoints: res.breakPoints.concat(res2)
  };
}
