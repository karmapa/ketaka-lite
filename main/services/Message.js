export function getMissingTagsMessage(filename = '', missingTags = []) {

  const list = missingTags.map(tag => {
    if (! tag.pbId) {
      return 'known - ' + tag.name;
    }
    return tag.pbId + ' - ' + tag.name;
  }).join(', ');

  return `The following tags in ${filename} are not finished: ${list}`;
}
