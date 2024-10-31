import React from 'react';
import { TailwindClass } from '../../../../data';
import { TableCompatibility } from '../components/TableCompatibility';
import { Title } from '../components/Title';

export const HeaderDocsTop = ({
  Data,
  title,
  id,
}: {
  Data: TailwindClass[];
  title: string;
  id: string;
}) => {
  return (
    <>
      <Title id={id}>{title}</Title>
      <TableCompatibility Data={Data}></TableCompatibility>
    </>
  );
};
