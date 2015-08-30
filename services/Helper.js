import _ from 'lodash';
import humps from 'humps';

export default class Helper {

  static propsEqual(props, oldObj, newObj) {
    return props.every(prop => _.isEqual(_.get(oldObj, prop), _.get(newObj, prop)));
  }

  static camelize(fromNames, obj) {
    let toNames = fromNames.map(name => humps.camelize(name));
    fromNames.forEach((name, index) => {
      obj[toNames[index]] = obj[name];
    });
    return obj;
  }
}
