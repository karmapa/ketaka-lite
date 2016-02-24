import keycode from 'keycode';

const FIX_KEYCODE = {
  'command': 'cmd',
  'right click': 'cmd'
};

export default function keyCode(code) {
  let result = keycode(code);
  let fix = FIX_KEYCODE[result];
  return fix ? fix : result;
}
