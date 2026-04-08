import { FC } from 'react';
import { LayoutItem } from '@/lib/types';

export type Props = LayoutItem;

const MissingItem: FC<Props> = ({ layoutItemType }) => {
  if (process.env.NODE_ENV === 'production') return <></>;

  return (
    <div className="p-32">
      <div className="rounded-md border border-orange-600 px-16 py-8 text-orange-600">
        <p>
          Item <b>{layoutItemType}</b> was not found. Did you mean{' '}
        </p>
      </div>
    </div>
  );
};

export default MissingItem;
