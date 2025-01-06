import type { AppProps } from 'next/app';
import Head from 'next/head';
import { installApp } from '@native-twin/adapters/next/_app';
import '../styles/globals.css';
import twConfig from '../tailwind.config';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Show case</title>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>
      <div className='flex-1 bg-gray-600 flex'>
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default installApp(twConfig, MyApp);
