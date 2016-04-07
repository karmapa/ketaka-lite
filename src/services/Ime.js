
const KEY_ENTER = 13;
const KEY_SHIFT = 16;
const KEY_BACKSPACE = 8;

import {extend, toArray, isFunction} from 'lodash';
import * as bo from '../constants/inputMethods/bo';

export default class Ime {

  static context = '';

  static inputmethod = null;

  static shifted = false;

  static setInputMethod(name) {

    let method = bo[name];

    if (method) {
      this.inputmethod = extend({
        contextLength: 0,
        maxKeyLength: 1
      }, method);
    }
    else {
      this.inputmethod = null;
    }
  }

  static keypress(e, options = {}) {

    let {cm, element} = options;

    let altGr = false;
    let keyCode = this.getKeyCode(e);

    if (! this.inputmethod) {
      return true;
    }

    e.preventDefault();

    // handle backspace
    if (KEY_BACKSPACE === keyCode) {
      this.context = '';
      return true;
    }

    if (e.altKey || e.altGraphKey) {
      altGr = true;
    }

    // Don't process ASCII control characters except linefeed,
    // as well as anything involving Ctrl, Meta and Alt,
    // but do process extended keymaps
    if ((keyCode < 32 && keyCode !== 13 && !altGr) || e.ctrlKey || e.metaKey) {
      // Blank the context
      this.context = '';
      return true;
    }

    let c = String.fromCharCode(keyCode);
    let pos, startPos, endPos;

    if (cm) {
      pos = cm.getCursor();
      startPos = pos.ch;
      endPos = startPos;
    }

    if (element) {
      startPos = element.selectionStart;
      endPos = element.selectionEnd;
    }

    let content = cm ? cm.getLine(pos.line) : e.target.value;
    let input = this.lastNChars(content, startPos, this.inputmethod.maxKeyLength);
    input += c;

    let replacement = this.transliterate(input, this.context, altGr);

    this.context += c;

    if (this.context.length > this.inputmethod.contextLength) {
      // The buffer is longer than needed, truncate it at the front
      this.context = this.context.substring(this.context.length - this.inputmethod.contextLength);
    }

    // Allow rules to explicitly define whether we match something.
    // Otherwise we cannot distinguish between no matching rule and
    // rule that provides identical output but consumes the event
    // to prevent normal behavior. See Udmurt layout which uses
    // altgr rules to allow typing the original character.
    if (replacement.noop) {
      return true;
    }

    // Drop a common prefix, if any
    let divergingPos = this.firstDivergence(input, replacement.output);
    input = input.substring(divergingPos);
    replacement.output = replacement.output.substring(divergingPos);

    e.stopPropagation();

    return this.replaceText(replacement.output, startPos - input.length + 1, endPos, {cm, e, pos});
  }

  static keyup(e) {
    let keyCode = this.getKeyCode(e);
    if (KEY_SHIFT === keyCode) {
      this.shifted = false;
    }
    if (KEY_ENTER === keyCode) {
      // it's a bug that codemirror don't fire keypress on enter key
      this.keypress.apply(this, toArray(arguments));
    }
  }

  static keydown(e) {
    let keyCode = this.getKeyCode(e);
    if (KEY_SHIFT === keyCode) {
      this.shifted = true;
    }
  }

  static transliterate(input, context, altGr) {

    let {inputmethod} = this;
    let patterns, regex, rule, replacement, i, retval;

    if (altGr) {
      patterns = inputmethod.patterns_x || [];
    }
    else {
      patterns = inputmethod.patterns || [];
    }

    if (this.shifted) {
       // if shift is pressed give priority for the patterns_shift
       // if exists.
       // Example: Shift + space where shift does not alter the keycode
       patterns = (inputmethod.patterns_shift || [])
         .concat(patterns);
    }

    if (isFunction(patterns)) {
      // For backwards compatibility, allow the rule functions to return plain
      // string. Determine noop by checking whether input is different from
      // output. If the rule function returns object, just return it as-is.
      retval = patterns.call(this, input, context);
      if ('string' === typeof retval) {
        return {noop: input === retval, output: retval};
      }
      return retval;
    }

    for (i = 0; i < patterns.length; i++) {
      rule = patterns[i];
      regex = new RegExp( rule[0] + '$' );

      // Last item in the rules.
      // It can also be a function, because the replace
      // method can have a function as the second argument.
      replacement = rule.slice( -1 )[0];

      // Input string match test
      if (regex.test(input)) {
        // Context test required?
        if (3 === rule.length) {
          if (new RegExp(rule[1] + '$').test(context)) {
            return {noop: false, output: input.replace(regex, replacement)};
          }
        } else {
          return {noop: false, output: input.replace(regex, replacement)};
        }
      }
    }

    // No matches, return the input
    return {noop: true, output: input};
  }

  static getKeyCode(e) {
    return e.which || e.keyCode || 0;
  }

  static lastNChars(str, pos, n) {
    if (0 === n) {
      return '';
    }
    else if (pos <= n) {
      return str.substr(0, pos);
    }
    else {
      return str.substr(pos - n, n);
    }
  }

  static replaceText(replacement, start, end, options = {}) {

    let {cm, e, pos} = options;

    if (cm) {
      cm.replaceRange(replacement, {line: pos.line, ch: start}, {line: pos.line, ch: end});
    }
    else {
      let value = e.target.value;
      return value.substring(0, start) + replacement + value.substring(end, value.length);
    }
  }

  static firstDivergence(a, b) {
    let minLength, i;
    minLength = a.length < b.length ? a.length : b.length;

    for (i = 0; i < minLength; i++) {
      if (a.charCodeAt(i) !== b.charCodeAt(i)) {
        return i;
      }
    }
    return -1;
  }
}
