// @ts-nocheck
import { createVariants } from '@native-twin/core';

// export const Composssssnent = () => {
//   return (
//     <div>
//       <div className={`bg-rose-700 bg-blue bg-black text(sm md:gray)`} />
//       {/* <div className={`bg-blue`} /> */}
//     </div>
//   ); 
// };

createVariants({
  base: 'bg-blue-200 bg-red-500 bg-black translate-x-2',
  variants: {
    variant: {
      primary: `bg-pink-200 bg-red`,
      sec: 'bg-red-200',
    },
  },
});

lol2`bg-gray-100`;
