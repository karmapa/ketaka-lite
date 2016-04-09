import keycode from 'keycode';

const FIX_KEYCODE = {
  'command': 'cmd',
  'right click': 'cmd'
};

export default function keyCode(code) {
  const result = keycode(code);
  const fix = FIX_KEYCODE[result];
  return fix ? fix : result;
}
