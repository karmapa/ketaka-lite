jest.unmock('lodash');
jest.unmock('../Tag');
const Tag = require('../Tag');
const fs = require('fs');

describe('Tag.strToTags', () => {

  it('tag should be extracted from string content', () => {
    const input = '<a/><b /><c  /><d a="1"/><e a="2" />';
    const output = ['<a/>', '<b />', '<c  />', '<d a="1"/>', '<e a="2" />'];
    expect(Tag.strToTags(input)).toEqual(output);
  });

  it('tag should be extracted from given xml file', () => {

    const input = fs.readFileSync(__dirname + '/sampleTags.txt').toString();
    const output = [
      '<division n="1" t="འདུལ་བ།  Vinaya  律部"/>',
      '<vol n="1" t="ཀ"/>',
      '<pb id="1.1a"/>',
      '<div >',
      '</div>',
      '<pb id="1.1b"/>',
      '<doc id="dbg"/>',
      '<stitle n="1" zh="1.3">',
      '</stitle>',
      '<ttitle n="1" zh="1.3">',
      '<head n="1" t="འདུལ་བ་གཞི། ༼ཀ༽" st="བི་ན་ཡ་བསྟུ། "/>',
      '</ttitle>',
      '<bampo n="1.1" zh="1.3"/>',
      '<pb id="5.8a"/>',
      '<p />',
      '<p />',
      '<p />',
      '<head n="2" t="སྤང་བའི་ལྟུང་བྱེད་ཀྱི་ཆོས་སུམ་ཅུ་བཤད་པ། " type="shepa" lv="2.5" zh="5.18"/>',
      '<head n="3" t="བཅུ་ཚན་དང་པོ། འཆང་བ་འབྲལ་འཇོག་སོགས་བཤད་པ། " type="bcutshen" lv="2.5.1" zh="5.18"/>',
      '<p />',
      '<p />',
      '<p />',
      '<p />',
      '<pb id="9.25b"/>',
      '<sutra id="J5"/>',
      '<doc id="dsmdbrpbp"/>',
      '<stitle n="5" zh="9.72">',
      '</stitle>',
      '<ttitle n="5" zh="9.72"/>',
      '<head n="1" t="དགེ་སློང་མའི་འདུལ་བ་རྣམ་པར་འབྱེད་པ། " st="བྷིཀྵུ་ཎཱི་བི་ན་ཡ་བི་བྷང་ག ། "/>',
      '<bampo n="5.1" zh="9.72"/>',
      '<head n="2" t="ཕམ་པར་འགྱུར་བའི་ཆོས་བརྒྱད་འཆད་པ། " type="chepa" lv="5.1" zh="9.72"/>',
      '<head n="3" t="ཕས་ཕམ་པར་གྱུར་པ་དང་པོ་འཆད་པ། " type="chepa" lv="5.1.1" zh="9.72"/>',
      '<pb id="46.307b"/>',
      '<note type="blankpage"/>',
      '<pb id="66.268a"/>',
      '<note type="blankpage">',
      '</note>',
      '<pb id="86.356b"/>',
      '<head n="4" t="རབ་ཏུ་བྱེད་པ་བཞི་པ། " type="byedba" zh="79.408"/>',
      '<bampo n="376.6"/>',
      '<pb id="108c.1b"/>',
      '<head n="1" t="བསྡུས་པའི་རྒྱུད་ཀྱི་རྒྱལ་པོ་དུས་ཀྱི་འཁོར་ལོའི་འགྲེལ་བཤད་རྩ་བའི་རྒྱུད་ཀྱི་རྗེས་སུ་འཇུག་པ་སྟོང་ཕྲག་བཅུ་གཉིས་པ་དྲི་མ་མེད་པའི་འོད་ཅེས་བྱ་བ། " st="བི་མ་ལ་པྲ་བྷཱ་ནཱ་མ་མཱུ་ལ་ཏནྟྲཱ་ནུ་སཱ་རི་ཎཱི་དྭཱ་ད་ཤ་སཱ་ཧ་སྲི་ཀཱ་ལ་གྷུ་ཀཱ་ལ་ཙཀྲ་ཏནྟྲ་རཱ་ཛ་ཊཱི་ཀཱ"/>',
      '<head n="2" t="ཡེ་ཤེས་ཀྱི་ལེའུའི་རྒྱས་འགྲེལ། "/>',
      '<pb id="108e.2b"/>',
      '<pb id="109.21a"/>',
      '<head n="2" t="དུས་འཁོར་བསྡུས་རྒྱུད་ཀྱི་འགྲེལ་བ་དྲི་མེད་འོད" type="dkarchag" zh="99.1"/>'
    ];

    expect(Tag.strToTags(input)).toEqual(output);
  });
});

describe('Tag.attrsToStr', () => {

  it('case 1:', () => {
    const input = ' id="9.25b" enabled yes="false"';
    const output = {
      id: '9.25b',
      enabled: true,
      yes: false
    };
    expect(Tag.attrStrToObj(input)).toEqual(output);
  });


  it('case 2:', () => {
    const input = ' enabled';
    const output = {
      enabled: true
    };
    expect(Tag.attrStrToObj(input)).toEqual(output);
  });
});

describe('Tag.getTagData', () => {

  it('should return self-closing tag data with no attrs', () => {
    const input = '<pb/>';
    const output = {
      name: 'pb',
      attrs: {},
      type: 'self-closing'
    };
    expect(Tag.getTagData(input)).toEqual(output);
  });

  it('should return open tag data', () => {
    const input = '<pb id="9.25b" name="name">';
    const output = {
      name: 'pb',
      attrs: {id: '9.25b', name: 'name'},
      type: 'open'
    };
    expect(Tag.getTagData(input)).toEqual(output);
  });

  it('should return close tag data', () => {
    const input = '</div>';
    const output = {
      name: 'div',
      attrs: {},
      type: 'close'
    };
    expect(Tag.getTagData(input)).toEqual(output);
  });

});

describe('Tag.getMissingTag', () => {

  it('should return missing tags', () => {
    const input = fs.readFileSync(__dirname + '/missingTags.txt').toString();
    const output = [{name: 'div', type: 'close', attrs: {}}];
    expect(Tag.getMissingTags(input)).toEqual(output);
  });

});
