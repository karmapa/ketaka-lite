import {REGEXP_PAGE} from './../constants/appConstants';

export default function(name1, name2) {
  const [match1, firstNum1, firstNum2, firstNum3, firstChar] = REGEXP_PAGE.exec(name1) || [];
  const [match2, secondNum1, secondNum2, secondNum3, secondChar] = REGEXP_PAGE.exec(name2) || [];

  if (firstNum1 > secondNum1) {
    return 1;
  }
  if (firstNum1 < secondNum1) {
    return -1;
  }
  // firstNum1 === secondNum1
  if (firstNum2 > secondNum2) {
    return 1;
  }
  if (firstNum2 < secondNum2) {
    return -1;
  }
  // firstNum2 === secondNum2
  if (firstNum3 > secondNum3) {
    return 1;
  }
  if (firstNum3 < secondNum3) {
    return -1;
  }
  // firstNum3 === secondNum3
  if (firstChar && secondChar) {
    if (firstChar > secondChar) {
      return 1;
    }
    if (firstChar < secondChar) {
      return -1;
    }
  }
  return 0;
}
