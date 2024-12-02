import * as Array from 'effect/Array';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

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

export class TreeNode<T> {
  // MARK: Properties

  value: T;
  children = Array.empty<TreeNode<T>>();
  parent: TreeNode<T> | null = null;
  id = Math.floor(Math.random() * Date.now());

  // MARK: init

  /**
   * Creates a new TreeNode instance.
   * @param value The value of the node.
   * @param parent The parent of the node.
   */
  constructor(value: T, parent: TreeNode<T> | null = null) {
    this.value = value;
    this.children = [];
    if (parent) {
      this.parent = parent;
    }
  }

  // MARK: Accessors
  get childrenCount() {
    return this.children.length;
  }

  // MARK: private functions

  getTreeString(node: TreeNode<T>, space = 0): string {
    return node.children.reduce(
      (prev, current) =>
        `${prev}${' '.repeat(space)}${JSON.stringify(current.value)}${this.getTreeString(current, space + 2)}`,
      '\n',
    );
  }

  // MARK: Public functions

  print() {
    return this.getTreeString(this);
  }

  addChild(value: T, _parent: TreeNode<T> | null = null) {
    const newNode = new TreeNode(value, _parent ?? this);
    this.children.push(newNode);
    return newNode;
  }

  /**
   * Gets all nodes in the tree below the current node.
   * @returns An array of TreeNode instances.
   */
  all(): TreeNode<T>[] {
    const nodes: TreeNode<T>[] = [];
    for (const value of this.children) {
      nodes.push(value);
      value.children && nodes.push(...value.all());
    }
    return nodes;
  }

  /**
   * Gets the path from the root node to the current node.
   * @returns An array of TreeNode instances.
   */
  getPath(): TreeNode<T>[] {
    const path: TreeNode<T>[] = [];
    let currentNode: TreeNode<T> | null = this;
    while (currentNode !== null) {
      path.push(currentNode);
      currentNode = currentNode.parent;
    }

    return path.reverse();
  }

  /**
   * Checks if the current node has any child nodes.
   * @returns `true` if the node has children, `false` otherwise.
   */
  hasChildren(): boolean {
    return this.children.length > 0;
  }

  /**
   * Checks if the current node has any siblings.
   * @returns `true` if the node has siblings, `false` otherwise.
   */
  hasSiblings(): boolean {
    return this.parent !== null && this.parent.children.length > 1;
  }

  /**
   * Checks if the current node is the root node.
   * @returns `true` if the node is the root node, `false` otherwise.
   */
  isRoot(): boolean {
    return this.parent === null || this.parent === undefined;
  }

  /**
   * Removes the current node from the tree.
   * @returns The new current node after removing the current node.
   */
  remove(): TreeNode<T> | null {
    if (this.parent) {
      const parent = this.parent;
      const index = parent.children.indexOf(this);
      if (index >= 0) parent.children.splice(index, 1);

      this.parent = null;
      return parent;
    } else {
      return null;
    }
  }

  /**
   * Traverses the tree starting from the current node.
   * @param callback A function to be called for each visited node.
   * @param traversal `true` to traverse the tree in depth-first order, `false` for breadth-first order.
   */
  traverse(
    callback: (node: TreeNode<T>) => void,
    traversal: 'breadthFirst' | 'depthFirst' | 'preOrder' | 'postOrder',
  ) {
    if (!this) return;

    if (traversal === 'preOrder') {
      // Pre-order traversal: visit the current node, then traverse the left subtree, then traverse the right subtree
      callback(this);
      this.children.forEach((child) => child.traverse(callback, traversal));
      return;
    }

    if (traversal === 'postOrder') {
      // Post-order traversal: traverse the left subtree, then traverse the right subtree, then visit the current node
      this.children.forEach((child) => child.traverse(callback, traversal));
      callback(this);
      return;
    }

    const collection: TreeNode<T>[] = [];
    collection.push(this);

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
  }

  toString(): any {
    return {
      id: this.id,
      value: this.value,
      childs: this.children.map((x) => x.toString()),
      childsCount: this.childrenCount,
      parent: this.parent,
    };
  }
}
