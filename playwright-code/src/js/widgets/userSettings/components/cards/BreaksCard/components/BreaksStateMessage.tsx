import React from 'react';
import { B2, Medium } from '@ids-ts/typography';
import { IconContainer } from '@ids-ts/icon-container';
import { useIntl } from '@payroll/quicksand';
import { StateMessageContainer, StateMessageText } from '../styles';

interface BreaksStateMessageProps {
  icon: React.FunctionComponent;
  messageId: string;
  testId: string;
}

/**
 * BreaksStateMessage Component
 *
 * Reusable component for displaying empty/error states in the Breaks Card.
 * Shows an icon with a message based on the current state.
 */
const BreaksStateMessage: React.FC<BreaksStateMessageProps> = ({
  icon,
  messageId,
  testId,
}) => {
  const intl = useIntl();

  return (
    <StateMessageContainer data-testid={testId}>
      <IconContainer
        background={{
          color: 'var(--color-container-background-secondary)',
          shape: 'circle',
        }}
        color="var(--color-ui-tertiary)"
        description={testId}
        size="medium"
        source={icon}
      />
      <StateMessageText>
        <B2>
          <Medium>{intl.formatMessage({ id: messageId })}</Medium>
        </B2>
      </StateMessageText>
    </StateMessageContainer>
  );
};

export default BreaksStateMessage;
