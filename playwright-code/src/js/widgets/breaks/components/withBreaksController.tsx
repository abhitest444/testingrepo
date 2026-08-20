import React from 'react';
import BreaksController from './BreaksController';

export const withBreaksController = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
) => {
  const WithBreaksController: React.FC<P> = (props) => (
    <BreaksController>
      <WrappedComponent {...props} />
    </BreaksController>
  );

  WithBreaksController.displayName = `WithBreaksController(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithBreaksController;
};
