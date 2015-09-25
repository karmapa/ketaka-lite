
let stackingState;

function changeStackingState(newState) {
  stackingState = newState;
}

function reinit() {
  changeStackingState(0);
}

reinit();

// isOneChar is true for composed sanskrit characters (ex གྷ)
function normalOrSub(normal, sub, alwaysStacked, isOneChar) {
  switch (stackingState) {
    case 0:
      return normal;
      break;
    case 1:
      if (! isOneChar) {
        changeStackingState(2);
      }
      return normal;
    case 2:
      if (! isOneChar) {
        changeStackingState(3);
      }
      return sub;
    default:
      if (alwaysStacked) {
        return sub;
      }
      changeStackingState(0);
      return normal;;
  }
}

function switchStacking() {
  if (! stackingState) {
    changeStackingState(1);
  } else {
    changeStackingState(0);
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
    [' ', () => {reinit(); return '་';}],
    ['\\.', () => {reinit(); return ' ';}],
    [',', () => {reinit(); return '།';}],
    [';', () => {reinit(); return '༔';}],
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
    ['གྷn', () => normalOrSub('གྷན', 'གྷྣ')],
    ['n', () => normalOrSub('ན', 'ྣ')],
    ['p', () => normalOrSub('པ', 'ྤ')],
    ['P', () => normalOrSub('ཕ', 'ྥ')],
    ['b', () => normalOrSub('བ', 'ྦ')],
    ['རྨm', () => normalOrSub('རྨམ', 'རྨྨ', true)],
    ['m', () => normalOrSub('མ', 'ྨ')],
    ['x', () => normalOrSub('ཙ', 'ྩ')],
    ['X', () => normalOrSub('ཚ', 'ྪ')],
    ['D', () => normalOrSub('ཛ', 'ྫ')],
    ['ྭw', () => normalOrSub('ྭཝ', 'ྭྭ')],
    ['w', () => normalOrSub('ཝ', 'ྭ', true)],
    ['W', () => normalOrSub('ཝ', 'ྺ')],
    ['Z', () => normalOrSub('ཞ', 'ྮ')],
    ['z', () => normalOrSub('ཟ', 'ྯ')],
    ['ཱ\'', () => normalOrSub('ཱ\'འ', 'ཱཱ')],
    ['\'', () => normalOrSub('འ', 'ཱ', true)],
    ['ྱy', () => normalOrSub('ྱཡ', 'ྱྱ')],
    ['y', () => normalOrSub('ཡ', 'ྱ', true)],
    ['l', () => normalOrSub('ལ', 'ླ')],
    ['i', () => {reinit(); return 'ི';}],
    ['u', () => {reinit(); return 'ུ';}],
    ['e', () => {reinit(); return 'ེ';}],
    ['o', () => {reinit(); return 'ོ';}],
    ['ལ([ྐ-ྷ]+)r', (_, capture) => {reinit(); return 'ལ' + capture + 'ར';}],
    ['ྐr', () => normalOrSub('ྐར', 'ྐྲ', true)],
    ['ྒr', () => normalOrSub('ྒར', 'ྒྲ', true)],
    ['ྣr', () => normalOrSub('ྣར', 'ྣྲ', true)],
    ['ྤr', () => normalOrSub('ྤར', 'ྤྲ', true)],
    ['ྦr', () => normalOrSub('ྦར', 'ྦྲ', true)],
    ['ྨr', () => normalOrSub('ྨར', 'ྨྲ', true)],
    ['སྡr', () => {reinit(); return 'སྡར';}],
    ['ྡr', () => normalOrSub('ྡར', 'ྡྲ', true)],
    ['ྦྷr', () => normalOrSub('ྦྷར', 'ྦྷྲ', true)],
    ['ྡྷr', () => normalOrSub('ྡྷར', 'ྡྷྲ', true)],
    ['ྒྷr', () => normalOrSub('ྒྷར', 'ྒྷྲ', true)],
    ['ྜྷr', () => normalOrSub('ྜྷར', 'ྜྷྲ', true)],
    ['ྟr', () => normalOrSub('ྟར', 'ྟྲ', true)],
    ['r', () => normalOrSub('ར', 'ྲ')],
    ['S', () => normalOrSub('ཤ', 'ྴ')],
    ['ཀB', () => normalOrSub('ཀཥ', 'ཀྵ', true, true)],
    ['ྐB', () => normalOrSub('ྐཥ', 'ྐྵ', true, true)],
    ['B', () => normalOrSub('ཥ', 'ྵ')],
    ['s', () => normalOrSub('ས', 'ྶ')],
    ['གh', () => normalOrSub('གཧ', 'གྷ', true, true)],
    ['ཌh', () => normalOrSub('ཌཧ', 'ཌྷ', true, true)],
    ['དh', () => normalOrSub('དཧ', 'དྷ', true, true)],
    ['བh', () => normalOrSub('བཧ', 'བྷ', true, true)],
    ['ཛh', () => normalOrSub('ཛཧ', 'ཛྷ', true, true)],
    ['ྒh', () => normalOrSub('ྒཧ', 'ྒྷ', true, true)],
    ['ྜh', () => normalOrSub('ྜཧ', 'ྜྷ', true, true)],
    ['ྡh', () => normalOrSub('ྡཧ', 'ྡྷ', true, true)],
    ['ྦh', () => normalOrSub('ྦཧ', 'ྦྷ', true, true)],
    ['ྫh', () => normalOrSub('ྫཧ', 'ྫྷ', true, true)],
    ['h', () => normalOrSub('ཧ', 'ྷ', true)],
    ['A', () => normalOrSub('ཨ', 'ྸ')],
    ['R', () => normalOrSub('ཪ', 'ྼ')],
    ['Y', 'ྻ'],
    ['ྲI', () => {reinit(); return 'ྲྀ';}],
    ['ླI', () => {reinit(); return 'ླྀ';}],
    ['I', () => {reinit(); return 'ྀ';}],
    ['E', () => {reinit(); return 'ཻ';}],
    ['O', () => {reinit(); return 'ཽ';}],
    ['J', () => {reinit(); return 'ིཾ';}],
    ['U', () => {reinit(); return 'ྀཾ';}],
    ['F', () => {reinit(); return 'ེཾ';}],
    ['L', () => {reinit(); return 'ོཾ';}],
    ['`', () => {reinit(); return 'ཽཾ';}],
    ['~', () => {reinit(); return 'ཻཾ';}],
    ['\\^', () => {reinit(); return '྄';}],
    ['\\!', () => {reinit(); return '༄༅༅';}],
    ['\\#', () => {reinit(); return '༁ྃ';}],
    ['\\%', () => {reinit(); return 'ྃ';}],
    ['\\+', () => {reinit(); return 'ྂ';}],
    ['\\&', () => {reinit(); return 'ཾ';}],
    ['\\<', () => {reinit(); return 'ༀ';}],
    ['\\=', () => {reinit(); return 'ཨཱཿ';}],
    ['\\>', () => {reinit(); return 'ཧཱུྃ';}],
    ['\\:', () => {reinit(); return 'ཿ';}],
    ['"', () => {reinit(); return '༄༅';}],
    ['@', () => {reinit(); return '༄';}],
    ['\\$', () => {reinit(); return '༅';}],
    ['\\/', () => {reinit(); return '༴';}],
    ['\\?', () => {reinit(); return '༈';}],
    ['\\|', () => {reinit(); return '྅';}],
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
