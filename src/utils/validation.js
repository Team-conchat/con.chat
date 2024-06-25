const isValidCSS = (styleCode) => {
  const dummyElement = document.createElement('div');
  dummyElement.style.cssText = styleCode;

  return dummyElement.style.length > 0;
};

const isValidPosition = (position) => {
  const positions = ['beforebegin', 'afterbegin', 'beforeend', 'afterend'];

  return positions.includes(position.toLowerCase());
};

export { isValidCSS, isValidPosition };
