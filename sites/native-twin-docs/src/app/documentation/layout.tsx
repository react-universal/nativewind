'use client';

import { useState } from 'react';
import { SearchButton } from '@/components/SearchButton';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import Link from 'next/link';
import { TAILWIND_GLOSSARY } from '../../../data';

export default function DocsPage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showDrawer, setShowDrawer] = useState(false);
  const handlerToggle = () => setShowDrawer(!showDrawer);
  return (
    <section className='relative py-[0px]  lg:grid gap-5 lg:grid-cols-4'>
      <div className=' hidden lg:flex relative left-0 top-0   flex-col lg:col-span-1 gap-5 '>
        {Object.entries(TAILWIND_GLOSSARY).map(([key, item]) => {
          return (
            <div className='mb-2' key={key}>
              {/* Título principal de cada tema */}
              <h3 className=' flex flex-col text-[24px] text-white'>{item.title}</h3>
              <ul>
                {item.categories.map((category, index) => (
                  <li
                    key={index}
                    className='text-gray-300 hover:text-white transition-all'
                  >
                    <Link href={'/documentation/' + category.route}>{category.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className=' lg:col-span-3  '>
        <div className=' flex lg:hidden'>
          <Drawer direction='left' open={showDrawer} onOpenChange={setShowDrawer}>
            <DrawerTrigger className='bg-purple-500 p-4 rounded-md fixed right-4 bottom-4 z-50 '>
              Menu
            </DrawerTrigger>
            <DrawerContent className='p-4 flex flex-col gap-2'>
              <DrawerClose className='w-full p-4 bg-purple-500 text-[18px]  text-center'>
                Exit
              </DrawerClose>
              <SearchButton></SearchButton>
              <div className='h-full grid grid-cols-2 overflow-x lg:grid-cols-4'>
                {Object.entries(TAILWIND_GLOSSARY).map(([key, item]) => {
                  return (
                    <div className='mb-2' key={key}>
                      {/* Título principal de cada tema */}
                      <h3 className=' flex text-[18px] flex-col lg:text-[24px] text-white'>
                        {item.title}
                      </h3>
                      <ul>
                        {item.categories.map((category, index) => (
                          <li
                            key={index}
                            className='text-gray-300'
                            onClick={handlerToggle}
                          >
                            {/* Nombre de la categoría con la ruta correspondiente */}
                            <Link href={'/documentation/' + category.route}>
                              {category.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        {children}
      </div>
    </section>
  );
}
