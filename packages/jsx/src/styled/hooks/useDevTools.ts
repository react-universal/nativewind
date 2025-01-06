// import { useEffect, useState } from 'react';
// import { RawJSXElementTreeNode } from '@native-twin/css/jsx';
// import { useNativeTwinDevTools } from '@native-twin/dev-tools';
// import { asArray } from '@native-twin/helpers';

// const flattenChilds = (tree: RawJSXElementTreeNode): RawJSXElementTreeNode[] => {
//   return asArray(tree)
//     .flatMap((x) => [x, ...x.childs.map((y) => flattenChilds(y))])
//     .flat();
// };
// export const useTwinDevTools = (id: string, tree: RawJSXElementTreeNode) => {
//   const [isSelected, setIsSelected] = useState(false);

//   const plugin = useNativeTwinDevTools();

//   useEffect(() => {
//     const sb = plugin.addListener('tree/node/selected', (data: any) => {
//       const childs = flattenChilds(tree);
//       const node = childs.find((x) => x.id === data.id);
//       if (node) {
//         console.debug('CHILDS: ', childs);
//         console.debug(data, id);
//         setIsSelected(true);
//       }
//     });
//     return () => {
//       sb();
//     };
//   }, [plugin, id, tree]);

//   useEffect(() => {
//     if (tree) {
//       plugin.registerTree(tree);
//     }
//   }, [tree, plugin]);

//   return { isSelected };
// };
