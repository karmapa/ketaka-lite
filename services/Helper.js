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
}
