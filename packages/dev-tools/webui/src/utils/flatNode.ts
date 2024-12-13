export function flatNode<T extends object>(node: T) {
  return Object.entries(node);
}
