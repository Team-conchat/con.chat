const getXPath = (element) => {
  if (element.id !== '') {
    return `id("${element.id}")`;
  }
  if (element === document.body) {
    return '/html/body';
  }

  let ix = 0;
  const siblings = element.parentNode.childNodes;

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];

    if (sibling === element) {
      return `${getXPath(element.parentNode)}/${element.tagName}[${ix + 1}]`;
    }

    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }

  return null;
};

const getElementByXPath = (XPath) => {
  const element = document.evaluate(
    XPath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;

  return element;
};

export { getXPath, getElementByXPath };
