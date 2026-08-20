import React, { useEffect, useState } from 'react';
import { Typography } from '@ids-ts/typography';
import { Button } from '@ids-ts/button';
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
} from '@ids-ts/modal-dialog';
import { useIntl, useSandbox } from '@payroll/quicksand';
import styled from 'styled-components';
import { NeoApiClient } from 'src/js/service/rest/NeoApiClient';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';

interface SubscriptionCancellationModalProps {
  // no props
}

interface SubscriptionInfo {
  isCancelled: boolean;
  companyDeleteDate?: string;
  showCancelDialog?: boolean;
  [key: string]: any;
}

const SectionSeparator = styled.hr`
  border: none;
  border-top: 1px solid var(--color-divider-tertiary); /* (SemanticContextMatchOnly) */
  margin: 24px 0 16px 0;
`;

const BoldText = styled.span`
  font-weight: 700;
`;

const SubscriptionCancellationModal: React.FC<
  SubscriptionCancellationModalProps
> = () => {
  const intl = useIntl();
  const logger = useLoggingConfig();
  const sandbox = useSandbox();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    NeoApiClient('homepage/subscriptionInfo', sandbox)
      .then((data) => {
        setInfo(data);
        if (data?.showCancelDialog) {
          setOpen(true);
        }
      })
      .catch((err) => {
        logger.error('Failed to fetch subscription info', {
          error: err?.message || err,
          stack: err?.stack,
        });
      });
  }, [sandbox, logger]);

  const handleClose = () => setOpen(false);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="medium"
      dismissible
      data-testid="subscription-cancellation-modal-container"
    >
      <div data-testid="subscription-cancellation-modal-dialog">
        <ModalHeader alignment="left">
          <Typography variant="headline-4" style={{ marginBottom: 8 }}>
            {intl.formatMessage({ id: 'subscription_canceled' })}
          </Typography>
        </ModalHeader>
        <ModalContent alignment="left">
          <>
            {info?.companyDeleteDate && (
              <Typography variant="body-1" style={{ marginBottom: 12 }}>
                {intl.formatMessage(
                  { id: 'company_data_delete_message' },
                  {
                    date: new Date(info.companyDeleteDate).toLocaleDateString(),
                  },
                )}
              </Typography>
            )}
            <Typography variant="body-1">
              {intl.formatMessage({ id: 'company_data_no_change_message' })}
            </Typography>
            <SectionSeparator />
            <Typography variant="body-1">
              <BoldText>
                {intl.formatMessage({ id: 'company_cancel_change_mind' })}
              </BoldText>
            </Typography>
          </>
        </ModalContent>
        <ModalActions alignment="right">
          <Button onClick={handleClose} style={{ marginTop: 16 }}>
            {intl.formatMessage({ id: 'close' })}
          </Button>
        </ModalActions>
      </div>
    </Modal>
  );
};

export default SubscriptionCancellationModal;
