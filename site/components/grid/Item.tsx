import { FC } from 'react';
import { deviceVisibility } from '@/utils/DeviceVisibility';
import { ItemRegistry, LayoutItem } from '@/lib/types';
import dynamic from 'next/dynamic';
import MissingItem from '@/components/grid/MissingItem';

const HeroBanner = dynamic(() => import('../home/HeroBanner'));
const Section = dynamic(() => import('../home/Section'));
const Message = dynamic(() => import('../home/MessageBanner'));

export type Props = LayoutItem;

const mappings: ItemRegistry = {
  'content/hero': HeroBanner,
  'content/section': Section,
  'content/message': Message,
} as ItemRegistry;

const Item: FC<Props> = ({ layoutItemType, configuration, ...props }) => {
  const SelectedComponent = mappings[layoutItemType];
  return (
    <div className={`${deviceVisibility(configuration)}`}>
      {SelectedComponent ? (
        <SelectedComponent data={configuration} />
      ) : (
        <MissingItem layoutItemType={layoutItemType} configuration={configuration} {...props} />
      )}
    </div>
  );
};

export default Item;
