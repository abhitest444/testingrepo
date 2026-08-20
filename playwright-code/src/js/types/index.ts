import { ApolloClient } from '@apollo/client';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { BaseWidgetProps } from 'web-shell-core/widgets/BaseWidget';

export type QBTimeFeatureTypes<T extends string> = T | 'default';
export type Functionality<T extends string> = T;

export interface QbTimeWidgetOptions<F extends string, F2 extends string> {
  feature: QBTimeFeatureTypes<F>;
  functionality?: Functionality<F2>;
  props?: any;
}

export interface QBTimeWidgetProps<F extends string, F2 extends string>
  extends BaseWidgetProps<QuickbooksOnlineSandbox> {
  options: QbTimeWidgetOptions<F, F2>;
  externalApolloClient?: ApolloClient<any>;
}

export type WidgetProps<T, F extends string, F2 extends string> = T &
  QBTimeWidgetProps<F, F2>;
