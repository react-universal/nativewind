'use client';

// import { ReactNode, useState } from 'react';
import tailwindConfig from '../../tailwind.config';
import { NativeTwinProvider } from './TwinProvider';

import { NativeTwinSheet } from '@native-twin/adapters/next/app';

// export default installApp(tailwindConfig, NativeTwin);

// export default NativeTwin;
export const TwinProvider = NativeTwinSheet(tailwindConfig);
