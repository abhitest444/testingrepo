import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import ToastMessage from '@ids-ts/toast-message';

export interface SuccessToastProps {
  message: string;
  open: boolean;
  onClose: () => void;
}

const StyledToastMessage = styled(ToastMessage)`
  z-index: 999999 !important;
`;

export const SuccessToast = ({ message, open, onClose }: SuccessToastProps) => {
  const portalRoot = useRef(document.createElement('div'));

  useEffect(() => {
    const { current: portalRootCurrent } = portalRoot;

    if (open) {
      document.body.appendChild(portalRootCurrent);
      ReactDOM.render(
        <StyledToastMessage
          dismissible={false}
          showIcon
          open={open}
          onClose={onClose}
        >
          {message}
        </StyledToastMessage>,
        portalRootCurrent,
      );
    }

    return () => {
      if (document.body.contains(portalRootCurrent)) {
        ReactDOM.unmountComponentAtNode(portalRootCurrent);
        document.body.removeChild(portalRootCurrent);
      }
    };
  }, [open]);

  return null;
};
