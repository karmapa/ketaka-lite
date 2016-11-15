jest.unmock('./../compare');
jest.unmock('./../../constants/regexpPage');
const compare = require('../compare').default;

describe('compare', () => {

  it('should sort ids correctly', () => {
    const input = ['1-1-1b', '1-1-1a', '1-4-2d', '1-2-1a'];
    const output = ['1-1-1a', '1-1-1b', '1-2-1a', '1-4-2d']
    const result = input.sort(compare);
    expect(result).toEqual(output);
  });

});

