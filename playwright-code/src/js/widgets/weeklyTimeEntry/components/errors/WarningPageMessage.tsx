import React from 'react';
import { CommonErrorMessage } from './CommonErrorMessage';

interface WarningPageMessageProps {
  title: string;
  message: string;
  onClose?: () => void;
}

export const WarningPageMessage: React.FC<WarningPageMessageProps> = ({
  title,
  message,
  onClose,
}) => (
  <CommonErrorMessage titleText={title} type="warn" open onClose={onClose}>
    {message}
  </CommonErrorMessage>
);
