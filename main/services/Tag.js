import _ from 'lodash';

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

export function strToTags(content = '') {
  // 1: self-closing tag e.g. <div />
  // 2: open tag e.g. <div>
  // 3: close tag e.g. </div>
  const tags = content.match(/<([\w\-]+)([^>]+)?\/>|<([\w\-]+)([^>]+)?>|<\s*\/([^>]+)?>/g);
  return tags || [];
}

