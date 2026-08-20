import { WidgetProps } from 'src/js/types';

export type TTO_HOME_FEATURE = 'tto-home';
export type TTO_HOME_FUNCTIONALITY = 'homepage-handle' | 'homepage-container';

export type TTO_HOME_PAGE_PROPS = {
  open: boolean;
  onClose: () => void;
};

export interface TTOHomePageItem {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
}

export interface RouteInfo {
  query?: {
    detailsPage?: string;
    [key: string]: any;
  };
}

export interface TTOProps {
  // Define any props you need here, or leave empty if none
}

export type TTOWidgetProps = WidgetProps<
  TTOProps,
  TTO_HOME_FEATURE,
  TTO_HOME_FUNCTIONALITY
> & {
  routeInfo?: RouteInfo;
  onError?: (error: Error | string) => void;
};
