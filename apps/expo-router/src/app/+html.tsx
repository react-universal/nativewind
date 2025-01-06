import { type TailwindUserConfig, install } from '@native-twin/core';
import { type SheetEntry, sheetEntriesToCss } from '@native-twin/css';
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import twinConfig from '../../tailwind.config';

let config = twinConfig as TailwindUserConfig;
if (twinConfig.mode !== 'web') {
  config = Object.assign({ mode: 'web' }, twinConfig) as TailwindUserConfig;
}
const twin = install(config, !__DEV__);

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  // const [twin] = useState(() => {
  //   let config = twinConfig as TailwindUserConfig;
  //   if (twinConfig.mode !== 'web') {
  //     config = Object.assign({ mode: 'web' }, twinConfig) as TailwindUserConfig;
  //   }
  //   return install(config, !__DEV__);
  // });
  // console.log('CHILDREN_ ', children);
  // console.log('TWIN: ', twin.target);
  // useEffect(() => {
  //   console.log('TWIN_LAYOUT: ', twin.target);
  // }, []);
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, shrink-to-fit=no'
        />
        <style
          dangerouslySetInnerHTML={{
            __html: sheetEntriesToCss(twin.target as SheetEntry[], true),
          }}
          data-native-twin=''
        />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}
