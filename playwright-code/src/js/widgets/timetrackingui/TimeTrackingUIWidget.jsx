import React from 'react';
import styled from 'styled-components';
// eslint-disable-next-line import/no-extraneous-dependencies
import BaseWidget from 'web-shell-core/widgets/BaseWidget';

import { QuicksandProvider } from '@payroll/quicksand';
import { TimeTrackingHOC } from 'src/js/widgets/timetrackingui/TimeTrackingHOC';
import nlsLoader from 'src/nls';

/**
 * Here we define our styles using styled-components
 * This must be done outside the render method for performance reason.
 * For more info, read https://www.styled-components.com/docs/basics#define-styled-components-outside-of-the-render-method
 */
const PluginContainer = styled.div`
  margin: 2rem 3rem;
`;

/** Basic plugin class */
class TimeTrackingUIWidget extends BaseWidget {
  /**
   * initializes component
   * @param {object} props : component props
   * @returns {void}
   */
  constructor(props) {
    super(props);
    this.handleWidgetDone = this.handleWidgetDone.bind(this);
    this.handleWidgetError = this.handleWidgetError.bind(this);
  }

  /**
   * Mounts the component, see React docs.
   * @returns {void}
   */
  componentDidMount() {
    const { sandbox } = this.props;
    this.ready();
    sandbox.logger.log('timetrackingui widget mounted.');
  }

  /**
   * This method will invoke the onDone callback provided by the consumer through the onDone
   * property with the given params. If the consumer does not provide the
   * onDone callback, this method will be a no op.
   * For more info: https://devportal.intuit.com/app/dp/capability/2611/capabilityDocs/main/docs/web-plugins-widgets/reference/widgets.md#instance-methods
   * @returns {void}
   */
  handleWidgetDone() {
    this.done();
  }

  /**
   * This method will invoke the onError callback provided by the consumer
   * through the onError property with the Error. If the consumer does not
   * provide the onError callback, this method will be a no op.
   * For more info: https://devportal.intuit.com/app/dp/capability/2611/capabilityDocs/main/docs/web-plugins-widgets/reference/widgets.md#instance-methods
   * @param {string} error: error string
   * @returns {void}
   */
  handleWidgetError(error) {
    this.err(error);
  }

  /**
   * Renders the plugin
   * We use the image that we imported above so it is handled in the browser when the plugin is loaded
   * @returns {void}
   */
  render() {
    const { sandbox } = this.props;
    return (
      <PluginContainer data-cy="time-tracking-ui-div">
        <QuicksandProvider
          sandbox={sandbox}
          nlsLoader={nlsLoader.requireNlsForLocale('timeTrackingUI')}
        >
          <TimeTrackingHOC />
        </QuicksandProvider>
      </PluginContainer>
    );
  }
}

export default TimeTrackingUIWidget;
