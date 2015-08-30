
let stackingState = 'no';

/*
 * What we want is to stack only two letters, except if the third is
 * ra (only after certain stacks), ya or wa (for standard tibetan),
 * or ha or aa (for sanskrit, under specific conditions). This makes
 * complex mantra stacks impossible, but feels more like the original
 * Sambhota keyboard.
 */
function normalOrSub(normal, sub, canBeThird, canBeFourth) {
  switch (stackingState) {
    case 'no':
      return normal;
      break;
    case 'nextisfirst':
      stackingState = 'nextissecond';
      return normal;
    case 'nextissecond':
      stackingState = 'nextisthird';
      return sub;
    case 'nextisthird':
      stackingState = 'nextisfourth';
      if (canBeThird) {
        return sub;
      } else {
        return normal;
      }
    default:    // nextisfourth
      stackingState = 'no';
      if (canBeFourth) {
        return sub;
      }
      else {
        return normal;
      }
  }
}

function reinit() {
  stackingState = 'no';
}

function switchStacking() {
  if ('no' === stackingState) {
    stackingState = 'nextisfirst';
  } else {
    stackingState = 'no';
  }
}

const BoSambhota = {
  id: 'bo-sambhota',
  name: 'Tibetan Sambhota',
  description: 'Tibetan Sambhota Input Method.',
  date: '2015-08-04',
  URL: 'https://github.com/tibetan-nlp/ttt/blob/master/source/Sambhota_keymap_one.rtf',
  author: 'Elie Roux <elie.roux@telecom-bretagne.eu>',
  license: 'GPLv3',
  version: '1.0',
  maxKeyLength: 5,
  patterns: [
    // consonants
    ['f', () => {switchStacking(); return '';}],
    ['a', () => {reinit(); return '';}],
    ['k', () => normalOrSub('ཀ', 'ྐ')],
    ['K', () => normalOrSub('ཁ', 'ྑ')],
    ['g', () => normalOrSub('ག', 'ྒ')],
    ['G', () => normalOrSub('ང', 'ྔ')],
    ['c', () => normalOrSub('ཅ', 'ྕ')],
    ['C', () => normalOrSub('ཆ', 'ྖ')],
    ['j', () => normalOrSub('ཇ', 'ྗ')],
    ['N', () => normalOrSub('ཉ', 'ྙ')],
    ['q', () => normalOrSub('ཊ', 'ྚ')],
    ['Q', () => normalOrSub('ཋ', 'ྛ')],
    ['v', () => normalOrSub('ཌ', 'ྜ')],
    ['V', () => normalOrSub('ཎ', 'ྞ')],
    ['t', () => normalOrSub('ཏ', 'ྟ')],
    ['T', () => normalOrSub('ཐ', 'ྠ')],
    ['d', () => normalOrSub('ད', 'ྡ')],
    ['n', () => normalOrSub('ན', 'ྣ')],
    ['p', () => normalOrSub('པ', 'ྤ')],
    ['P', () => normalOrSub('ཕ', 'ྥ')],
    ['b', () => normalOrSub('བ', 'ྦ')],
    ['m', () => normalOrSub('མ', 'ྨ')],
    ['x', () => normalOrSub('ཙ', 'ྩ')],
    ['X', () => normalOrSub('ཚ', 'ྪ')],
    ['D', () => normalOrSub('ཛ', 'ྫ')],
    ['w', () => normalOrSub('ཝ', 'ྭ', true)],
    ['W', () => normalOrSub('ཝ', 'ྺ')],
    ['Z', () => normalOrSub('ཞ', 'ྮ')],
    ['z', () => normalOrSub('ཟ', 'ྯ')],
    ['\'', () => normalOrSub('འ', 'ཱ', true, true)],
    ['y', () => normalOrSub('ཡ', 'ྱ', true)],
    ['སྐr', () => normalOrSub('སྐར', 'སྐྲ', true)],
    ['སྒr', () => normalOrSub('སྒར', 'སྒྲ', true)],
    ['སྣr', () => normalOrSub('སྣར', 'སྣྲ', true)],
    ['སྤr', () => normalOrSub('སྤར', 'སྤྲ', true)],
    ['སྦr', () => normalOrSub('སྦར', 'སྦྲ', true)],
    ['སྨr', () => normalOrSub('སྨར', 'སྨྲ', true)],
    ['r', () => normalOrSub('ར', 'ྲ')],
    ['l', () => normalOrSub('ལ', 'ླ')],
    ['S', () => normalOrSub('ཤ', 'ྴ')],
    ['ཀB', () => normalOrSub('ཀཥ', 'ཀྵ')],
    ['ྐB', () => normalOrSub('ྐཥ', 'ྐྵ', true)],
    ['B', () => normalOrSub('ཥ', 'ྵ')],
    ['s', () => normalOrSub('ས', 'ྶ')],
    ['གh', () => normalOrSub('གཧ', 'གྷ')],
    ['ཌh', () => normalOrSub('ཌཧ', 'ཌྷ')],
    ['དh', () => normalOrSub('དཧ', 'དྷ')],
    ['བh', () => normalOrSub('བཧ', 'བྷ')],
    ['ཛh', () => normalOrSub('ཛཧ', 'ཛྷ')],
    ['ྒh', () => normalOrSub('ྒཧ', 'ྒྷ', true)],
    ['ྜh', () => normalOrSub('ྜཧ', 'ྜྷ', true)],
    ['ྡh', () => normalOrSub('ྡཧ', 'ྡྷ', true)],
    ['ྦh', () => normalOrSub('ྦཧ', 'ྦྷ', true)],
    ['ྫh', () => normalOrSub('ྫཧ', 'ྫྷ', true)],
    ['h', () => normalOrSub('ཧ', 'ྷ', true)],
    ['A', () => normalOrSub('ཨ', 'ཨ')],
    ['R', () => normalOrSub('ཪ', 'ྼ')],
    ['Y', 'ྻ'],
    ['ྲI', () => {reinit(); return 'ྲྀ';}],
    ['ླI', () => {reinit(); return 'ླྀ';}],
    ['i', () => {reinit(); return 'ི';}],
    ['u', () => {reinit(); return 'ུ';}],
    ['e', () => {reinit(); return 'ེ';}],
    ['o', () => {reinit(); return 'ོ';}],
    ['I', () => {reinit(); return 'ྀ';}],
    ['E', () => {reinit(); return 'ཻ';}],
    ['O', () => {reinit(); return 'ཽ';}],
    ['J', () => {reinit(); return 'ིཾ';}],
    ['U', () => {reinit(); return 'ྀཾ';}],
    ['F', () => {reinit(); return 'ེཾ';}],
    ['L', () => {reinit(); return 'ོཾ';}],
    ['`', () => {reinit(); return 'ཽཾ';}],
    ['~', () => {reinit(); return 'ཻཾ';}],
    ['\\!', () => {reinit(); return '༄༅༅';}],
    ['\\#', () => {reinit(); return '༁ྃ';}],
    ['\\%', () => {reinit(); return 'ྃ';}],
    ['\\+', () => {reinit(); return 'ྂ';}],
    ['\\&', () => {reinit(); return 'ཾ';}],
    ['\\<', () => {reinit(); return 'ༀ';}],
    ['\\=', () => {reinit(); return 'ཨཱཿ';}],
    ['\\>', () => {reinit(); return 'ཧཱུྃ';}],
    [';', () => {reinit(); return '༔';}],
    ['\\:', () => {reinit(); return 'ཿ';}],
    ['"', () => {reinit(); return '༄༅';}],
    ['\\/', () => {reinit(); return '༴';}],
    ['\\?', () => {reinit(); return '༈';}],
    ['\\|', () => {reinit(); return '྅';}],
    [' ', () => {reinit(); return '་';}],
    [',', () => {reinit(); return '།';}],
    ['-', () => {reinit(); return '༑';}],
    ['\\(', () => {reinit(); return '༼';}],
    ['\\)', () => {reinit(); return '༽';}],
    // numbers
    ['0', () => {reinit(); return '༠';}],
    ['1', () => {reinit(); return '༡';}],
    ['2', () => {reinit(); return '༢';}],
    ['3', () => {reinit(); return '༣';}],
    ['4', () => {reinit(); return '༤';}],
    ['5', () => {reinit(); return '༥';}],
    ['6', () => {reinit(); return '༦';}],
    ['7', () => {reinit(); return '༧';}],
    ['8', () => {reinit(); return '༨';}],
    ['9', () => {reinit(); return '༩';}]
  ]
};

export default BoSambhota;
