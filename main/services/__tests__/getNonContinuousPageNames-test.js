jest.dontMock('lodash');
jest.dontMock('../getNonContinuousPageNames');

let getNonContinuousPageNames = require('../getNonContinuousPageNames');

describe('getNonContinuousPageNames', () => {

  it('getNonContinuousPageNames case 1: ', () => {
    let input = ['1.1a', '1.2a', '1.2b', '1.3a', '1.3b'];
    let output = ['1.1b'];
    expect(getNonContinuousPageNames(input)).toEqual(output);
  });

  it('getNonContinuousPageNames case 2: ', () => {
    let input = ['1.1a', '1.1b', '1.2a', '1.2b', '1.2c', '1.3a', '1.3b'];
    let output = ['1.2d'];
    expect(getNonContinuousPageNames(input)).toEqual(output);
  });

  it('getNonContinuousPageNames case 3: ', () => {
    let input = ['1.1a', '1.1b', '1.3a', '1.3b'];
    let output = ['1.2a', '1.2b'];
    expect(getNonContinuousPageNames(input)).toEqual(output);
  });

  it('getNonContinuousPageNames case 3: ', () => {
    let input = ['1.1a', '1.1b', '2.1a', '2.1b'];
    let output = [];
    expect(getNonContinuousPageNames(input)).toEqual(output);
  });
});

