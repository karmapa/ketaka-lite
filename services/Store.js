
export default class Store {

  static set(prop, value) {
    localStorage.setItem(prop, JSON.stringify(value));
  }

  static get(prop) {
    return JSON.parse(localStorage.getItem(prop));
  }

}
