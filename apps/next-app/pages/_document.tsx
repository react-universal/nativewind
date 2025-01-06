import { AppRegistry } from 'react-native';
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from 'next/document';
import { installDocument } from '@native-twin/adapters/next/_document';

export async function getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
  AppRegistry.registerComponent('Main', () => Main);
  // @ts-expect-error untyped
  AppRegistry.getApplication('Main');
  const page = await ctx.renderPage();
  return { ...page };
}

class MyDocument extends Document {
  getInitialProps = getInitialProps;
  override render() {
    const currentLocale = this.props.__NEXT_DATA__.locale || 'en';
    return (
      <Html lang={currentLocale}>
        <Head>
          <meta charSet='UTF-8' />
          <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
          {/* <script src='http://localhost:8097'></script> */}
        </Head>
        <body className='min-h-screen min-w-full'>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default installDocument(MyDocument);
