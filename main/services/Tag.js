let _ = require('lodash');

export function attrsToStr(attrs) {
  return _.map(attrs, (value, attr) => attr + '="' + value + '"').join(' ');
}

export function tagToStr(node) {

  if (node.children) {
    return '<' + node.name + ' ' + attrsToStr(node.attribs) + '>' + node.children.map(tagToStr).join('') + '</' + node.name + '>';
  }
  else if ('tag' === node.type) {
    return '<' + node.name + ' ' + attrsToStr(node.attribs) + '/>';
  }
  else if ('text' === node.type) {
    return node.data;
  }
}

export function isTag(node) {
  return 'tag' === node.type;
}

export function isPbNode(node) {
  return ('tag' === node.type) && ('pb' === node.name);
}

export function isTextNode(node) {
  return 'text' === node.type;
}
