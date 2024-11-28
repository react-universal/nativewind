/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TreeNode } from './TreeNode.js';

export class Tree<T> {
  root: TreeNode<T>;
  constructor(value: T) {
    this.root = new TreeNode(value);
  }

  /**
   * Traverses the tree using the specified traversal method,
   * calling the provided callback function on each visited node.
   * @param callback A function to call on each visited node.
   * @param traversal The traversal method to use. Can be one of:
   * 'breadthFirst', 'depthFirst', 'preOrder', 'postOrder'.
   */
  traverse(
    callback: (node: TreeNode<T>) => void,
    traversal: 'breadthFirst' | 'depthFirst' | 'preOrder' | 'postOrder',
  ) {
    if (!this.root) return;

    if (traversal === 'preOrder') {
      // Pre-order traversal: visit the current node, then traverse the left subtree, then traverse the right subtree
      callback(this.root);
      return Promise.all(
        this.root.children.map((child) => child.traverse(callback, traversal)),
      );
    }

    if (traversal === 'postOrder') {
      // Post-order traversal: traverse the left subtree, then traverse the right subtree, then visit the current node
      Promise.all(this.root.children.map((child) => child.traverse(callback, traversal)));
      callback(this.root);
      return;
    }

    const collection: TreeNode<T>[] = [];
    collection.push(this.root);

    while (collection.length > 0) {
      let current: TreeNode<T>;
      if (traversal === 'depthFirst') current = collection.pop()!;
      else current = collection.shift()!;

      callback(current);
      if (traversal === 'depthFirst') {
        for (let i = current.children.length - 1; i >= 0; i--)
          collection.push(current.children[i]!);
      } else {
        for (const child of current.children) collection.push(child);
      }
    }
    return;
  }

  /**
   * Returns all the nodes of the tree in an array.
   */
  all(): TreeNode<T>[] {
    const nodes: TreeNode<T>[] = [];
    if (this.root) {
      nodes.push(this.root);
      for (const value of this.root.children) {
        nodes.push(value);
        value.children && nodes.push(...value.all());
      }
    }
    return nodes;
  }

  map<B>(f: (a: TreeNode<T>) => TreeNode<B>): Tree<B> {
    const current = this;
    this.traverse((node) => {
      return f(node) as any;
    }, 'depthFirst');
    return current as any;
  }
}
