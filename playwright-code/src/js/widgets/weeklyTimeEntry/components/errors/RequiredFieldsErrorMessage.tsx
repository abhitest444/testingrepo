import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { B3 } from '@ids-ts/typography';
import CommonErrorMessage from './CommonErrorMessage';

interface RequiredFieldsErrorMessageProps {
  errorMessages: string[];
  onClose?: () => void;
}

export const RequiredFieldsErrorMessage: React.FC<
  RequiredFieldsErrorMessageProps
> = ({ errorMessages, onClose }) => {
  const intl = useIntl();

  if (!errorMessages || errorMessages.length === 0) {
    return null;
  }

  // Check if we have only a single message (like over hours limit)
  const [firstMessage] = errorMessages;
  const hasOnlySingleMessage = errorMessages.length === 1;

  // Determine if we have multiple messages with bullet points
  const hasMultipleMessages = errorMessages.length > 1;
  const hasBulletPoints = errorMessages.some((msg) => msg.includes('•'));
  const hasNonEmptyBulletPoints = errorMessages.some(
    (msg) => msg.includes('•') && msg.trim() !== '•',
  );

  // Determine the title text based on message type
  let titleText: string;
  if (hasOnlySingleMessage) {
    // Use the single message as title text
    titleText = firstMessage;
  } else if (
    hasMultipleMessages &&
    hasBulletPoints &&
    hasNonEmptyBulletPoints
  ) {
    // Multiple messages with non-empty bullet points: use "Following needs attention" as title
    titleText = intl.formatMessage({
      id: 'weekly.time.entry.validation.following.needs.attention',
    });
  } else {
    // Single error or other cases: use first message as title
    titleText = firstMessage;
  }

  // Get messages to render as list items (skip the first message if it's used as title)
  const listMessages =
    hasMultipleMessages && hasBulletPoints
      ? errorMessages.slice(1)
      : errorMessages.slice(1);

  return (
    <CommonErrorMessage
      key={errorMessages.join(',')} // Force re-render when error messages change
      type="error"
      titleText={titleText}
      onClose={onClose}
    >
      {listMessages.length > 0 && (
        <ul>
          {listMessages.map((message) => (
            <li key={message} style={{ listStyleType: 'circle-filled' }}>
              <B3>{message}</B3>
            </li>
          ))}
        </ul>
      )}
    </CommonErrorMessage>
  );
};
