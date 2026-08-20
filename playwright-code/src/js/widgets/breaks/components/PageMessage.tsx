import React from 'react';
import PageMessage from '@ids-ts/page-message';
import { useIntl } from '@payroll/quicksand';
import { selectPageMessage } from 'src/js/widgets/breaks/store/uiSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';

interface PageMessageState {
  show: boolean;
  type: 'error' | 'success' | 'info';
  message: string;
  code?: string;
}

interface PageMessageProps {
  clearAction: () => any;
  testId?: string;
}

const GenericPageMessage: React.FC<PageMessageProps> = ({
  clearAction,
  testId = 'page-message',
}) => {
  const pageMessage = useAppSelector(selectPageMessage);
  const dispatch = useAppDispatch();
  const intl = useIntl();
  if (!pageMessage.show) {
    return null;
  }

  const handleClose = () => {
    dispatch(clearAction());
  };

  // Use code as the message id if present, otherwise fallback to the raw message
  // If no code or code not found, use generic error message from nls
  let displayMessage = pageMessage.message;

  if (pageMessage.code) {
    // Try the code directly first, fallback to generic error
    const formatted = intl.formatMessage(
      { id: `breaks.api.error.${pageMessage.code}` },
      {},
      { defaultMessage: '' },
    );
    displayMessage =
      formatted || intl.formatMessage({ id: 'breaks.api.error.GENERAL_ERROR' });
  } else {
    // For messages without code, use generic error
    displayMessage = intl.formatMessage({
      id: 'breaks.api.error.GENERAL_ERROR',
    });
  }

  // Handle descriptionNlsKey
  let displayDescription = pageMessage.descriptionNlsKey
    ? intl.formatMessage({ id: pageMessage.descriptionNlsKey })
    : displayMessage;

  if (pageMessage.descriptionNlsKey === undefined) {
    displayDescription = null;
  }

  // Handle title: use title from state if provided, otherwise fallback to titleNlsKey
  const displayTitle =
    pageMessage.title ||
    (pageMessage.titleNlsKey
      ? intl.formatMessage({ id: pageMessage.titleNlsKey })
      : '');

  return (
    <PageMessage
      type={pageMessage.type}
      data-testid={testId}
      dismissible={pageMessage.type !== 'error'}
      onClose={handleClose}
      open={pageMessage.show}
      title={displayTitle}
    >
      {displayDescription}
    </PageMessage>
  );
};

export default GenericPageMessage;
