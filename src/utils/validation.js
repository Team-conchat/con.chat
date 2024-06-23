const isValidCSS = (styleCode) => {
  const dummyElement = document.createElement('div');
  dummyElement.style.cssText = styleCode;

  return dummyElement.style.length > 0;
};

export default isValidCSS;
