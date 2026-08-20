import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { QuicksandProvider } from '@payroll/quicksand';
import BaseWidget, { BaseWidgetProps } from 'web-shell-core/widgets/BaseWidget';
import { Provider } from 'react-redux';
import nlsLoader from 'src/nls';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import store from './store';
import CustomFieldsPreferenceContainer from './components/CustomFieldsPreferenceContainer';
import { CustomFieldData } from '../timeTrackingSettings/types';

interface CustomFieldProps extends BaseWidgetProps<any> {
  open?: boolean;
  onClose?: () => void;
  setShowCustomFieldDrawer?: (show: boolean) => void;
  setCustomFieldData?: (data: CustomFieldData | null) => void;
  refreshTrigger?: number;
  externalApolloClient?: any;
  onError?: (error: Error | string) => void;
}

export default class ManageCustomFieldWidget extends BaseWidget<CustomFieldProps> {
  state = {
    isOpen: true,
  };

  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.log('ManageCustomField widget mounted');
  }

  componentDidCatch(error: Error) {
    this.props.sandbox.logger.error(
      'Plugin=time-tracking-ui Error=MANAGE_CUSTOM_FIELD_WIDGET_CRASH',
      { error },
    );
    this.props.onError?.(error);
  }

  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose();
    } else {
      this.setState({ isOpen: false });
    }
  };

  render() {
    const {
      sandbox,
      externalApolloClient,
      setShowCustomFieldDrawer,
      setCustomFieldData,
      refreshTrigger,
    } = this.props;
    const client = externalApolloClient ?? getApolloClientInstance(sandbox);

    if (!client) {
      return <div>Error: Apollo client not initialized</div>;
    }

    return (
      <QuicksandProvider
        sandbox={sandbox}
        nlsLoader={
          nlsLoader.requireNlsForLocale([
            'customField',
            'assignments',
            'assignmentDrawer',
          ]) as any
        }
      >
        <ApolloProvider client={client}>
          <Provider store={store}>
            <CustomFieldsPreferenceContainer
              open={this.state.isOpen}
              onClose={this.handleClose}
              setShowCustomFieldDrawer={setShowCustomFieldDrawer}
              setCustomFieldData={setCustomFieldData}
              refreshTrigger={refreshTrigger}
            />
          </Provider>
        </ApolloProvider>
      </QuicksandProvider>
    );
  }
}
