// import type { RuntimeJSXStyle } from '@native-twin/css/jsx';
// import { useAtomValue } from '@native-twin/helpers/react';
// import { useMemo } from 'react';
// import { type StyledContext, styledContext } from '../../store/observables';
// import type { JSXInternalProps } from '../../types/jsx.types';

// export const useMetroComponent = (originalProps: JSXInternalProps) => {
//   const styledCtx = useAtomValue(styledContext);

//   const styles = useMemo(() => {
//     const injected = originalProps._twinInjected;
//     if (!injected) return null;

//     const mappedProps = injected.props.reduce(
//       (prev, current) => {
//         const inherited = current.entries.filter((x) => x.inherited);
//         const base = current.entries.map((x) => x.group === 'base');
//         return prev;
//       },
//       {} as Record<string, any>,
//     );
//   }, [originalProps._twinInjected]);
// };

// const compileDeclarations = (list: RuntimeJSXStyle['declarations'], ctx: StyledContext) => {
//   return list.map((decl) => {
//     if (decl._tag === 'COMPILED') {
      
//     }
//     return ;
//   });
// };
