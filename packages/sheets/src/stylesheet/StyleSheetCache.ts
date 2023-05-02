type Node<T> = {
  value: T;
  next?: Node<T>;
  prev?: Node<T>;
};

function createNode<T>(value: T): Node<T> {
  return { value };
}

export default class StyleSheetCache<TKey, TValue> {
  private length: number;
  private head?: Node<TValue>;
  private tail?: Node<TValue>;
  private lookup: Map<TKey, Node<TValue>>;
  private reverseLookup: Map<Node<TValue>, TKey>;

  private detach(node: Node<TValue>): void {
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
    if (this.length === 1) {
      this.head = this.tail = undefined;
    }
    if (this.head === node) {
      this.head = this.head.next;
    }
    if (this.tail === node) {
      this.tail = this.tail.prev;
    }
    node.next = node.prev = undefined;
  }

  private prepend(node: Node<TValue>): void {
    if (!this.head) {
      this.head = this.tail = node;
      return;
    }
    node.next = this.head;
    this.head.prev = node;
    this.head = node;
  }

  private trimCache(): void {
    if (this.length <= this.capacity) {
      return;
    }
    const tail = this.tail as Node<TValue>;
    this.detach(this.tail as Node<TValue>);

    const key = this.reverseLookup.get(tail) as TKey;
    this.lookup.delete(key);
    this.reverseLookup.delete(tail);
    this.length--;
  }

  constructor(private capacity: number) {
    this.length = 0;
    this.head = this.tail = undefined;
    this.lookup = new Map();
    this.reverseLookup = new Map();
  }

  update(key: TKey, value: TValue): void {
    // 1. Check if key exists in cache
    let node = this.lookup.get(key);
    if (!node) {
      node = createNode(value);
      this.length++;
      this.prepend(node);
      this.trimCache();
      this.lookup.set(key, node);
      this.reverseLookup.set(node, key);
    } else {
      this.detach(node);
      this.prepend(node);
      node.value = value;
    }
    // 2. if it doesn't exist, we need to insert it
    //    - Check capacity and evict if necessary
    // 3. if it does exist, we need to update to the front of the list
  }

  get(key: TKey): TValue | null {
    // 1.  Check if key exists in list
    const node = this.lookup.get(key);
    if (!node) {
      return null;
    }
    // 2. If it does, update the key's position in the list and move it to the front
    this.detach(node);
    this.prepend(node);
    // 3. return the value or undefined if it doesn't exist
    return node.value;
  }
}
