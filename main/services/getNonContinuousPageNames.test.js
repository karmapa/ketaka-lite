import test from 'ava';
import getNonContinuousPageNames from './getNonContinuousPageNames';

test('getNonContinuousPageNames case 1: ', t => {
  let input = ['1.1a', '1.2a', '1.2b', '1.3a', '1.3b'];
  let output = ['1.1b'];
  t.same(getNonContinuousPageNames(input), output);
});

test('getNonContinuousPageNames case 2: ', t => {
  let input = ['1.1a', '1.1b', '1.2a', '1.2b', '1.2c', '1.3a', '1.3b'];
  let output = ['1.2d'];
  t.same(getNonContinuousPageNames(input), output);
});

test('getNonContinuousPageNames case 3: ', t => {
  let input = ['1.1a', '1.1b', '1.3a', '1.3b'];
  let output = ['1.2a', '1.2b'];
  t.same(getNonContinuousPageNames(input), output);
});

test('getNonContinuousPageNames case 3: ', t => {
  let input = ['1.1a', '1.1b', '2.1a', '2.1b'];
  let output = [];
  t.same(getNonContinuousPageNames(input), output);
});
