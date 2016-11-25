jest.unmock('./../compare');
jest.unmock('./../parsePbId');
jest.unmock('./../../constants/regexpPage');
const compare = require('../compare').default;

describe('compare', () => {

  it('should sort ids correctly', () => {
    const input = ['1-1-1b', '1-1-1a', '1-4-2d', '1-2-1a'];
    const output = ['1-1-1a', '1-1-1b', '1-2-1a', '1-4-2d']
    const result = input.sort(compare);
    expect(result).toEqual(output);
  });

  it('github issue #180', () => {
    const input = [
      '1-1-1a',
      '1-1-1b',
      '1-1-10a',
      '1-1-10b',
      '1-1-2a',
      '1-1-2b',
      '1-10-1a',
      '1-10-1b',
      '1-2-1a',
      '1-2-1b',
      '10-1-1a',
      '10-1-1b',
      '2-1-1a',
      '2-1-1b'
    ];
    const output = [
      '1-1-1a',
      '1-1-1b',
      '1-1-2a',
      '1-1-2b',
      '1-1-10a',
      '1-1-10b',
      '1-2-1a',
      '1-2-1b',
      '1-10-1a',
      '1-10-1b',
      '2-1-1a',
      '2-1-1b',
      '10-1-1a',
      '10-1-1b'
    ];
    const result = input.sort(compare);
    expect(result).toEqual(output);
  });
});

