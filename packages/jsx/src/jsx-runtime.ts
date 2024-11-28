import { createElement as originalCreateElement } from 'react';
import ReactJSXRuntime from 'react/jsx-runtime';
import jsxWrapper from './jsx-wrapper.js';

/**
 * This the entry point for the @native-twin/jsx runtime.
 * The babel plugin swaps the `jsxImportSource` to this module.
 * These functions need to be very light weight as they are the hottest function calls in a React application
 * @see https://babeljs.io/docs/babel-plugin-transform-react-jsx
 * @see https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md#summary
 */
export { Fragment } from 'react';
export const jsxs = jsxWrapper((ReactJSXRuntime as any).jsxs);
export const jsx = jsxWrapper((ReactJSXRuntime as any).jsx);
export const jsxDEV = jsxWrapper((ReactJSXRuntime as any).jsxDEV);
export const createTwinElement = jsxWrapper(originalCreateElement as any);
export const createElement = originalCreateElement;
