import REGEXP_PAGE from './../constants/regexpPage';

export default function parsePbId(name) {

  return (REGEXP_PAGE.exec(name) || [])
    .map((value, index) => {
      if ((1 <= index) && (index <= 3)) {
        return parseInt(value, 10);
      }
      return value;
    });
}
