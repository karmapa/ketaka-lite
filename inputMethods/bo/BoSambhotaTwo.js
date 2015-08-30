let stacking = false;
let first = true;

function normalOrSub(normal, sub) {
  if ((stacking && first) || !stacking) {
    first = false;
    return normal;
  } else {
    return sub;
  }
}

function reinit() {
  first = false;
  stacking = false;
}

function switchStacking() {
  first = true;
  stacking = !stacking;
}

const BoSambhotaTwo = {
  id: 'bo-sambhota2',
  name: 'Tibetan Sambhota 2',
  description: 'Tibetan Sambhota 2 Input Method.',
  date: '2015-08-21',
  URL: 'https://github.com/tibetan-nlp/ttt/blob/master/source/Sambhota_keymap_one.rtf',
  author: 'Elie Roux <elie.roux@telecom-bretagne.eu>',
  license: 'GPLv3',
  version: '1.0',
  maxKeyLength: 5,
  patterns: [
    // consonants
    ['h', () => {switchStacking(); return '';}],
    ['q', () => normalOrSub('ཀ', 'ྐ')],
    ['w', () => normalOrSub('ཁ', 'ྑ')],
    ['e', () => normalOrSub('ག', 'ྒ')],
    ['r', () => normalOrSub('ང', 'ྔ')],
    ['t', () => normalOrSub('ཅ', 'ྕ')],
    ['y', () => normalOrSub('ཆ', 'ྖ')],
    ['u', () => normalOrSub('ཇ', 'ྗ')],
    ['i', () => normalOrSub('ཉ', 'ྙ')],
    ['Q', () => normalOrSub('ཊ', 'ྚ')],
    ['W', () => normalOrSub('ཋ', 'ྛ')],
    ['E', () => normalOrSub('ཌ', 'ྜ')],
    ['R', () => normalOrSub('ཎ', 'ྞ')],
    ['o', () => normalOrSub('ཏ', 'ྟ')],
    ['p', () => normalOrSub('ཐ', 'ྠ')],
    ['\\[', () => normalOrSub('ད', 'ྡ')],
    ['\\]', () => normalOrSub('ན', 'ྣ')],
    ['a', () => normalOrSub('པ', 'ྤ')],
    ['s', () => normalOrSub('ཕ', 'ྥ')],
    ['d', () => normalOrSub('བ', 'ྦ')],
    ['f', () => normalOrSub('མ', 'ྨ')],
    ['k', () => normalOrSub('ཙ', 'ྩ')],
    ['l', () => normalOrSub('ཚ', 'ྪ')],
    [';', () => normalOrSub('ཛ', 'ྫ')],
    ['\'', () => normalOrSub('ཝ', 'ྭ')],
    ['z', () => normalOrSub('ཞ', 'ྮ')],
    ['x', () => normalOrSub('ཟ', 'ྯ')],
    ['c', () => normalOrSub('འ', 'ཱ')],
    ['v', () => normalOrSub('ཡ', 'ྱ')],
    ['m', () => normalOrSub('ར', 'ྲ')],
    [',', () => normalOrSub('ལ', 'ླ')],
    ['\\.', () => normalOrSub('ཤ', 'ྴ')],
    ['ཀT', () => normalOrSub('ཀཥ', 'ཀྵ')],
    ['ྐT', () => normalOrSub('ྐཥ', 'ྐྵ')],
    ['T', () => normalOrSub('ཥ', 'ྵ')],
    ['\\/', () => normalOrSub('ས', 'ྶ')],
    ['ག\\>', () => normalOrSub('གཧ', 'གྷ')],
    ['ཌ\\>', () => normalOrSub('ཌཧ', 'ཌྷ')],
    ['ད\\>', () => normalOrSub('དཧ', 'དྷ')],
    ['བ\\>', () => normalOrSub('བཧ', 'བྷ')],
    ['ཛ\\>', () => normalOrSub('ཛཧ', 'ཛྷ')],
    ['ྒ\\>', () => normalOrSub('ྒཧ', 'ྒྷ')],
    ['ྜ\\>;', () => normalOrSub('ྜཧ', 'ྜྷ')],
    ['ྡ\\>', () => normalOrSub('ྡཧ', 'ྡྷ')],
    ['ྦ\\>', () => normalOrSub('ྦཧ', 'ྦྷ')],
    ['ྫ\\>', () => normalOrSub('ྫཧ', 'ྫྷ')],
    ['\\>', () => normalOrSub('ཧ', 'ྷ')],
    ['\\?', () => normalOrSub('ཨ', 'ཨ')],
    ['ྲG', () => {reinit(); return 'ྲྀ';}],
    ['ླG', () => {reinit(); return 'ླྀ';}],
    ['g', () => {reinit(); return 'ི';}],
    ['j', () => {reinit(); return 'ུ';}],
    ['b', () => {reinit(); return 'ེ';}],
    ['n', () => {reinit(); return 'ོ';}],
    ['G', () => {reinit(); return 'ྀ';}],
    ['B', () => {reinit(); return 'ཻ';}],
    ['N', () => {reinit(); return 'ཽ';}],
    ['J', () => {reinit(); return 'ིཾ';}],
    ['z', () => {reinit(); return 'ྀཾ';}],
    ['P', () => {reinit(); return 'ེཾ';}],
    ['L', () => {reinit(); return 'ོཾ';}],
    ['`', () => {reinit(); return 'ཽཾ';}],
    ['~', () => {reinit(); return 'ཻཾ';}],
    ['\\+', () => {reinit(); return '༄༅༅';}],
    ['\\#', () => {reinit(); return '༁ྃ';}],
    ['\\%', () => {reinit(); return 'ྃ';}],
    ['\\&', () => {reinit(); return 'ཾ';}],
    ['V', () => {reinit(); return 'ༀ';}],
    ['\\=', () => {reinit(); return 'ཨཱཿ';}],
    ['M', () => {reinit(); return 'ཧཱུྃ';}],
    ['K', () => {reinit(); return '༔';}],
    ['\\:', () => {reinit(); return 'ཿ';}],
    ['\\<', () => {reinit(); return '༄༅';}],
    ['\\\\', () => {reinit(); return '༴';}],
    ['\\?', () => {reinit(); return '༈';}],
    ['\\|', () => {reinit(); return '྅';}],
    [' ', () => {reinit(); return '་';}],
    ['C', () => {reinit(); return '།';}],
    ['\\{', () => {reinit(); return '༑';}],
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

export default BoSambhotaTwo;
