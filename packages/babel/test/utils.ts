import { Tree } from '../bck/utils/Tree';

const tree = new Tree('root');
const root = tree.root;
const r1 = root.addChild('root:1');
r1.addChild('root:1:1');
root.addChild('root:2');
root.toString(); //?
