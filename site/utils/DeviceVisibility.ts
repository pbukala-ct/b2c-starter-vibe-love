import { LayoutItemConfiguration } from '@/lib/types';

export const deviceVisibility = (configuration: LayoutItemConfiguration) => {
  return `${configuration.mobile ? 'block' : 'hidden'} ${configuration.tablet ? 'md:block' : 'md:hidden'} ${
    configuration.desktop ? 'lg:block' : 'lg:hidden'
  }`;
};
