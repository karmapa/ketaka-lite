import humps from 'humps';

export default class Helper {

  static camelize(fromNames, obj) {
    let toNames = fromNames.map(name => humps.camelize(name));
    fromNames.forEach((name, index) => {
      obj[toNames[index]] = obj[name];
    });
    return obj;
  }

  static handleReverseSelection(from, to) {
    return (from.ch > to.ch) ? [to, from] : [from, to];
  }

  static chunkString(str, length) {
    return str.match(new RegExp('[\\S\\s]{1,' + length + '}', 'g'));
  }

  static allIndexOf(str, toSearch) {
    let indices = [];
    for (let pos = str.indexOf(toSearch); pos !== -1; pos = str.indexOf(toSearch, pos + 1)) {
      indices.push(pos);
    }
    return indices;
  }
}
