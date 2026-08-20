/**
 * This file provides a basic mock of HOCWidget for unit tests
 */
import React from 'react';

class HOCWidget extends React.Component {
  ready() {
    return this;
  }

  render() {
    const { widgetId, label, ...rest } = this.props;

    if (widgetId === 'qbo-quickfills-ui/quickfills') {
      return <div widgetId={widgetId}>{label}</div>;
    }

    return (
      <hoc-widget widgetId={widgetId} label={label}>
        {widgetId}
      </hoc-widget>
    );
  }
}

export default HOCWidget;
