import './globals.css';
import { Inter } from 'next/font/google';
import { TwinProvider } from './_lib/NativeTwin';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={inter.className}>
      <body>{<TwinProvider>{children}</TwinProvider>}</body>
    </html>
  );
}
