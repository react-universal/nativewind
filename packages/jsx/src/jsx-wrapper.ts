// import { stylizeJSXChilds } from './jsx/jsx-childs.js';
import { jsxStyles } from './jsx/jsx-styles.js';
import { stylizedComponents } from './styled/index.js';
import type { JSXFunction } from './types/jsx.types.js';

/**
 * Create a new JSX function that swaps the component type being rendered with
 * the 'styled' version of the component if it exists.
 */
export default function jsxWrapper(jsx: JSXFunction): JSXFunction {
  return (type, props, ...rest) => {
    // This is invalid react code. Its used by the doctor to check if the JSX pragma is set correctly
    if ((type as any) === 'react-native-twin-jsx-pragma-check') {
      return true as any;
    }

    // Load the core React Native components and create the interop versions
    // We avoid this in the test environment as we want more fine-grained control
    // This call also need to be inside the JSX transform to avoid circular dependencies
    if (process.env['NODE_ENV'] !== 'test') require('./components');

    // You can disable the native twin jsx by setting `twEnabled` to false
    if (props && props.twEnabled === false) {
      delete props.twEnabled;
    } else {
      // Swap the component type with styled if it exists
      type = stylizedComponents.get(type) ?? type;
    }

    // stylizeJSXChilds(props);
    jsxStyles(props, type);

    // Call the original jsx function with the new type
    return jsx.call(jsx, type, props, ...rest);
  };
}
