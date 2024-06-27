import {
  COMPONENT_BLOCK_STYLE,
  ROOT_COMPONENT_BLOCK_STYLE,
} from '../constant/chat.js';

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

const colorize = (text, styles) => {
  return [`%c${text}`, styles];
};

const findReactRootNode = (element) => {
  if (!element) return null;

  if (
    Object.keys(element).some(
      (key) =>
        key.startsWith('__reactFiber$') ||
        key.startsWith('__reactInternalInstance$'),
    )
  ) {
    return element;
  }

  const childrenArray = Array.from(element.children);
  let reactNode = null;

  childrenArray.some((children) => {
    reactNode = findReactRootNode(children);

    return reactNode;
  });

  return reactNode;
};

const findReactFiber = (element) => {
  const reactKey = Object.keys(element).find(
    (key) =>
      key.startsWith('__reactFiber$') ||
      key.startsWith('__reactInternalInstance$'),
  );

  return reactKey ? element[reactKey] : null;
};

const findHostComponent = (fiber) => {
  let node = fiber;

  while (node) {
    if (node.stateNode instanceof HTMLElement) {
      return node.stateNode;
    }

    node = node.child;
  }

  return null;
};

const traverseFiberTree = (
  fiber,
  depth = 0,
  isLast = true,
  prefix = '',
  isRoot = false,
) => {
  if (!fiber) return;

  const connector = isLast ? '└─' : '├─';
  const line = depth > 0 ? `${prefix}${connector}` : '';

  if (isRoot) {
    const domElement = findHostComponent(fiber);
    const componentType = '▸';

    const [styledComponentName, styleString] = colorize(
      'App',
      ROOT_COMPONENT_BLOCK_STYLE,
    );

    console.log(
      `${line}${componentType} ${styledComponentName}`,
      styleString,
      domElement,
    );
  } else if (fiber.type && fiber.type.name) {
    const componentName = fiber.type.name;
    const componentType = '▸';

    const [styledComponentName, styleString] = colorize(
      componentName,
      COMPONENT_BLOCK_STYLE,
    );

    if (componentName === 'Routes' || componentName === 'RenderedRoute') {
      console.log(
        `${line}${componentType} ${styledComponentName}`,
        styleString,
      );
    } else {
      const domElement = findHostComponent(fiber);

      if (domElement) {
        console.log(
          `${line}${componentType} ${styledComponentName}`,
          styleString,
          domElement,
        );
      } else {
        console.log(
          `${line}${componentType} ${styledComponentName}`,
          styleString,
        );
      }
    }
  }

  if (fiber.child) {
    let { child } = fiber;
    let siblingCount = 0;

    while (child) {
      siblingCount++;
      child = child.sibling;
    }

    child = fiber.child;
    let count = 0;

    while (child) {
      count++;

      const isLastChild = count === siblingCount;
      const newPrefix = `${prefix}${isLast ? '  ' : '| '}`;

      traverseFiberTree(child, depth + 1, isLastChild, newPrefix);
      child = child.sibling;
    }
  }
};

const findAppFiber = (fiber) => {
  let node = fiber;

  while (node) {
    if (
      node.type &&
      (node.type.name === 'App' || node.type.displayName === 'App')
    ) {
      return node;
    }

    node = node.child;
  }

  return fiber;
};

const drawComponentTree = () => {
  const rootElement = findReactRootNode(document.body);

  if (!rootElement) {
    console.log('🚫 리액트 루트 요소를 찾을 수 없습니다.');
  } else {
    const fiberRoot = findReactFiber(rootElement);

    if (fiberRoot) {
      const appFiber = findAppFiber(fiberRoot);
      traverseFiberTree(appFiber, 0, true, '', true);
    } else {
      console.log('🚫 파이버 루트를 찾을 수 없습니다.');
    }
  }
};

export { traverseFragment, findReactRootContainer, drawComponentTree };
