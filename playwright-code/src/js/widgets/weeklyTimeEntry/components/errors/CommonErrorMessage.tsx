import React from 'react';
import styled from 'styled-components';
import PageMessage from '@ids-ts/page-message';

const StyledPageMessage = styled(PageMessage)`
  &&& {
    margin-bottom: 1em;
  }
`;

interface CommonErrorMessageProps {
  /** The title text to display */
  titleText?: string;
  /** The type of message (error, warn, info) */
  type?: 'error' | 'warn' | 'info';
  /** Whether the message can be dismissed */
  dismissable?: boolean;
  /** Whether the message is visible */
  open?: boolean;
  /** The label for the action button */
  actionLabel?: string;
  /** Optional callback for when the action button is clicked */
  onActionClick?: () => void;
  /** Optional callback for when the message is dismissed */
  onClose?: () => void;
  /** Children content to display in the message */
  children?: React.ReactNode;
}

export const CommonErrorMessage: React.FC<CommonErrorMessageProps> = ({
  titleText = '',
  type = 'error',
  dismissable = false,
  open = true,
  actionLabel,
  onActionClick,
  onClose,
  children,
}) => (
  <StyledPageMessage
    type={type}
    open={open}
    dismissible={false}
    title={titleText}
    actionLabel={actionLabel}
    onActionClick={onActionClick}
    onClose={onClose}
  >
    {typeof children === 'string' && children.includes('<br>') ? (
      <div dangerouslySetInnerHTML={{ __html: children }} />
    ) : (
      children
    )}
  </StyledPageMessage>
);

export default CommonErrorMessage;
