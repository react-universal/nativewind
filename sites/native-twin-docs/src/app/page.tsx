import { ButtonVariable } from '@/components/ButtonVariable';
import { SearchButton } from '@/components/SearchButton';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import img2 from '../../public/1.webp';
import img3 from '../../public/2.webp';
import img1 from '../../public/3.webp';

const features = [
  {
    title: 'Use of Tailwind CSS',
    description:
      'Leverage the popularity and flexibility of Tailwind CSS for rapid prototyping and responsive design.',
  },
  {
    title: 'Compatibility with React Native',
    description:
      'Ideal for developers looking to build mobile applications using React Native while maintaining a smooth user experience.',
  },
  {
    title: 'Dynamic Styles',
    description:
      'Apply and modify styles dynamically based on component properties or application state.',
  },
  {
    title: 'Performance Optimization',
    description:
      'Designed to minimize bundle size, ensuring your application remains fast and efficient.',
  },
  {
    title: 'Extensible Customization',
    description:
      "Offers options to customize themes and styles, adapting to your project's specific needs.",
  },
];
export default function Home() {
  return (
    <div className='relative flex flex-col gap-8'>
      <header className='grid  gap-5'>
        <div className='flex flex-col gap-5'>
          <h1 className='text-3xl lg:text-[57px] lg:leading-tight  m-0 '>
            Tailwind CSS in React Native
          </h1>
          <p className='text-xl m-0'>
            Native Twin allows developers to apply Tailwind CSS styling across both React
            Native (for mobile) and React (for web) applications. With an intuitive
            syntax, you can leverage your existing knowledge of Tailwind CSS for seamless
            application styling. Built with performance in mind, Native Twin ensures
            efficient rendering and a smooth user experience.
          </p>
          <div className='mt-auto flex flex-col lg:flex-row items-center justify-center gap-5'>
            <Link href={'/documentation'}>
              <ButtonVariable color='#26C6DA'>Get Started</ButtonVariable>
            </Link>
            <SearchButton />
          </div>
        </div>
      </header>

      <section className='py-[50px] flex flex-col items-center gap-5'>
        <div className='gap-4 flex flex-col items-center justify-center my-[20px]'>
          <h2 className='flex flex-col text-center text-[36px]'>
            Work in Native Like in Web
          </h2>
          <p className='text-center max-w-[900px]'>
            Discover how Native Twin transforms development by allowing you to use
            Tailwind CSS classes in both environments. The simplicity and efficiency it
            offers will change the way you build your applications.
          </p>
          <Link href='/documentation'>
            <ButtonVariable color='#26C6DA'>Explore More</ButtonVariable>
          </Link>
        </div>
        <div className='grid  gap-[20px] w-full'>
          {
            // Addd here the editor
          }
        </div>
      </section>

      <section className='py-[50px] flex flex-col  gap-5'>
        <h2 className='text-center text-[36px]'>Key Features</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          {features.map((feature, index) => (
            <Card key={index} className='p-5 bg-gray-800 text-white shadow-md rounded-lg'>
              <h3 className='font-bold text-lg'>{feature.title}</h3>
              <p className='mt-2 text-gray-300'>{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className='py-[50px] text-center'>
        <p>Follow us on GitHub to stay updated on the latest releases!</p>
      </footer>
    </div>
  );
}
