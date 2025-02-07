export const ellipsisInMiddle = (str, maxLength = 40) => {
  if (str.length > maxLength) {
    return str.substr(0, maxLength / 2) + "..." + str.substr(-5);
  }
  return str;
};
