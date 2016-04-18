export function getMissingTagsMessage(filename = '', missingTags = []) {

  const list = missingTags.map(tag => {
    if (! tag.pbId) {
      return 'known - ' + tag.name;
    }
    return tag.pbId + ' - ' + tag.name;
  }).join('\n');

  return `The following tags in ${filename} are not finished:\n ${list}`;
}
