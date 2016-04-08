import {each, find} from 'lodash';
import Api from './Api';

export default class Event {

  constructor() {
    this.events = [];
  }

  on(name, cb) {
    this.events.push({name, cb});
    Api.on(name, cb);
  }

  off(name) {

    const event = find(this.events, {name});

    if (event) {
      Api.off(name, event.cb);
    }
    else {
      each(this.events, ({name, cb}) => Api.off(name, cb));
    }
  }
}
