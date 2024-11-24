import { RuntimeComponentEntry } from '@native-twin/css/jsx';
import type { TreeNode } from '@native-twin/helpers/tree';
import { JSXElementNode } from '../../models/JSXElement.model.js';
import type { JSXElementTree } from '../../models/jsx.models.js';
import { extractMappedAttributes } from './twin-jsx.utils.js';

export const jsxTreeNodeToJSXElementNode = (
  leave: TreeNode<JSXElementTree>,
  entries: RuntimeComponentEntry[],
  filename: string,
): JSXElementNode => {
  const runtimeData = extractMappedAttributes(leave.value.babelNode);
  return new JSXElementNode({
    leave,
    order: leave.value.order,
    filename,
    runtimeData,
    entries,
  });
};
