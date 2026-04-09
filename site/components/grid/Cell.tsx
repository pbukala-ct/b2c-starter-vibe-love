import { FC, PropsWithChildren } from 'react';
import { LayoutElementConfiguration } from '@/lib/types';
import { deviceVisibility } from '@/utils/DeviceVisibility';

export type Props = PropsWithChildren<{
  configuration: LayoutElementConfiguration;
}>;

const Cell: FC<Props> = ({ configuration, children }) => {
  return (
    <div className={deviceVisibility(configuration) + ` col-span-${configuration.size || 12}`}>
      {children}
    </div>
  );
};

export default Cell;
