import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import PageMessage from '@ids-ts/page-message';
import { useIntl } from '@payroll/quicksand';

const StyledPageMessage = styled(PageMessage)`
  &&& {
    align-items: flex-start;
    margin-bottom: 1em;
    flex: 0 1 auto;

    .ids-ts-page-message__icon {
      margin-top: 2px;
    }

    .ids-ts-page-message__content {
      margin-left: 8px !important;
    }
  }
`;

interface LockedTimeEntryMessageProps {
  /** If provided, the component is controlled. If not, it is self-dismissing. */
  open?: boolean;
  /** Whether the lock reason is submitted status */
  isSubmitted?: boolean;
  /** Whether the lock reason is a missing manage-timesheet permission */
  noManagePermission?: boolean;
  /** Optional callback for when the message is dismissed */
  onClose?: () => void;
}

export const LockedTimeEntryMessage: React.FC<LockedTimeEntryMessageProps> = ({
  open,
  isSubmitted,
  noManagePermission,
  onClose,
}) => {
  const intl = useIntl();
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  const getCopyKeys = () => {
    if (noManagePermission) {
      return {
        titleKey: 'time.entry.no.manage.permission.title',
        messageKey: 'time.entry.no.manage.permission.message',
      };
    }
    if (isSubmitted) {
      return {
        titleKey: 'time.entry.submitted.title',
        messageKey: 'time.entry.submitted.message',
      };
    }
    return {
      titleKey: 'time.entry.approved.title',
      messageKey: 'time.entry.approved.message',
    };
  };
  const { titleKey, messageKey } = getCopyKeys();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  };

  return (
    <StyledPageMessage
      type="info"
      open={internalOpen}
      dismissible
      onClose={handleClose}
      title={intl.formatMessage({ id: titleKey })}
    >
      {intl.formatMessage({ id: messageKey })}
    </StyledPageMessage>
  );
};
