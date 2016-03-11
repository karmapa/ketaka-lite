let _ = require('lodash');

export function attrsToStr(attrs) {
  return _.map(attrs, (value, attr) => attr + '="' + value + '"').join(' ');
}

export function isTag(node) {
  return 'tag' === node.type;
}

export function isPbTag(node) {
  return isTag(node) && ('pb' === node.name);
}

export function isTextNode(node) {
  return 'text' === node.type;
}

export function tagToStr(node) {

  // empty non-self-closing tag
  if (node.data === node.name) {
    node.children = [];
  }

  // non-self-closing tag
  if (node.children) {
    return '<' + node.name + ' ' + attrsToStr(node.attribs) + '>' + node.children.map(tagToStr).join('') + '</' + node.name + '>';
  }

  // self-closing tag
  if (isTag(node)) {
    return '<' + node.name + ' ' + attrsToStr(node.attribs) + '/>';
  }

  if (isTextNode(node)) {
    return node.data;
  }
}
