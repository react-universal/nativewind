import './globals.css';
import { Navbar } from '@/components/Navbar';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from './theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Native Twin',
    default: 'Native Twin',
  },
  description:
    'Effortlessly style your React and React Native applications with Tailwind CSS.',
  keywords: ['Tailwind CSS', 'React', 'React Native', 'Styling'],
  openGraph: {
    title: 'Native Twin',
    description:
      'A library for styling React and React Native applications using Tailwind CSS.',

    images: [
      {
        url: 'https://avatars.githubusercontent.com/u/123605744?s=48&v=4', // Replace with your image URL
        width: 800,
        height: 600,
        alt: 'Image of Native Twin',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={
          inter.className + ' bg-gradient-to-r from-slate-900 to-slate-800 bg-fixed '
        }
      >
        <ThemeProvider attribute='class' defaultTheme='dark'>
          <Navbar />
          <div className='min-h-[100vh] py-[80px] text-white max-w-[1400px] w-[95%] m-auto'>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
