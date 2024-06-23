const findReactRootContainer = () => {
  const bodyElements = document.body.children;

  for (let i = 0; i < bodyElements.length; i++) {
    const element = bodyElements[i];
    const keys = Object.keys(element);

    for (let j = 0; j < keys.length; j++) {
      const key = keys[j];

      if (key.includes('__reactContainer$')) {
        return element[key].stateNode.current;
      }
    }
  }

  console.log('🚫 Root를 찾을 수 없습니다.');

  return null;
};

const traverseFragment = (component) => {
  const fragmentComponents = ['<React.Fragment />'];

  const traverse = (target) => {
    if (target === null) return;

    if (typeof target.type === 'function') {
      fragmentComponents.push(target.type.name);
    } else {
      fragmentComponents.push(target.stateNode);
    }

    if (target.sibling) traverse(target.sibling);
  };

  traverse(component);

  return fragmentComponents;
};

export { traverseFragment, findReactRootContainer };
