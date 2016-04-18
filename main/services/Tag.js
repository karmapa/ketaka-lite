import {map, last, flatten} from 'lodash';

export function attrsToStr(attrs) {
  return map(attrs, (value, attr) => attr + '="' + value + '"').join(' ');
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
  const tags = (content || '').match(/<([\w\-]+)([^>]+)?\/>|<([\w\-]+)([^>]+)?>|<\s*\/([^>]+)?>/g);
  return tags || [];
}

export function attrStrToObj(attrStr = '') {
  const re = new RegExp('\\s*([\\w\\-]+)(="([^"]+)")?\\s*', 'g');
  let obj = {};
  let match;
  while (match = re.exec(attrStr)) {
    let [all, prop, equal, value] = match;

    // handle boolean values
    if ('true' === value) {
      value = true;
    }
    if ('false' === value) {
      value = false;
    }
    obj[prop] = undefined === value ? true : value;
  }
  return obj;
}

export function getTagData(tag = '') {

  tag = tag || '';

  const matchSelfClosing = tag.match(/^<([\w\-]+)([^>]+)?\/>$/);

  if (matchSelfClosing) {
    const [all, name, attrStr] = matchSelfClosing;
    return {name, attrs: attrStrToObj(attrStr), type: 'self-closing'};
  }

  const matchOpen = tag.match(/^<([\w\-]+)([^>]+)?>$/);

  if (matchOpen) {
    const [all, name, attrStr] = matchOpen;
    return {name, attrs: attrStrToObj(attrStr), type: 'open'};
  }

  const matchClose = tag.match(/^\<\s*\/\s*([\w\-]+)\s*\>$/);

  if (matchClose) {
    const [all, name, attrStr] = matchClose;
    return {name, attrs: attrStrToObj(attrStr), type: 'close'};
  }

  return null;
}


export function findBrokenTags(content = '') {

  let currentPbId = null;

  return (content || '').split('\n')
    .map(line => {

      const pbTag = strToTags(line).map(getTagData)
        .filter(row => 'pb' === row.name)[0];

      if (pbTag) {
        currentPbId = pbTag.attrs.id;
      }
      const [all, name] = ((line + '\n').match(/<([\w\-]*)[^>^\n]*[\n<]/) || []);
      if (all) {
        return {name, pbId: currentPbId};
      }
      return null;
    })
    .filter(row => null !== row)
    .reduce((a, b) => a.concat(b), []);    // flatten
}

export function getMissingTags(content = '') {

  content = content || '';

  let currentPbId = null;

  return strToTags(content)
    .map(getTagData)
    .reduce((stacks, row) => {

      if ('self-closing' === row.type) {
        if ('pb' === row.name) {
          currentPbId = row.attrs.id;
        }
        return stacks;
      }

      const prev = last(stacks);

      if (prev && (prev.name === row.name) && (('open' === prev.type) && ('close' === row.type))) {
        stacks.pop();
      }
      else {
        row.pbId = currentPbId;
        stacks.push(row);
      }
      return stacks;
    }, [])
    .map(row => {
      row.type = ('open' === row.type) ? 'close' : 'open';
      return row;
    })
    .concat(findBrokenTags(content));
}
