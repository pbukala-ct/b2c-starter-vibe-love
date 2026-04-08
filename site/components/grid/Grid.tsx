import { FC, PropsWithChildren } from 'react';

type Props = PropsWithChildren;

const Grid: FC<Props> = ({ children }) => {
  return (
    <div className={'body-section relative w-full grow'}>
      <div className={'grid grid-cols-12'}>{children}</div>
    </div>
  );
};

export default Grid;
