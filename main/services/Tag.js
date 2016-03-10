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

  if (node.children) {
    return '<' + node.name + ' ' + attrsToStr(node.attribs) + '>' + node.children.map(tagToStr).join('') + '</' + node.name + '>';
  }
  else if (isTag(node)) {
    return '<' + node.name + ' ' + attrsToStr(node.attribs) + '/>';
  }
  else if (isTextNode(node)) {
    return node.data;
  }
}
