import React from 'react';
import styled from 'styled-components';

import {
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  ModalImage,
  ModalTitle,
} from '@ids-ts/modal-dialog';
import Button from '@ids-ts/button';
import { Activity } from '@ids-ts/loader';
import { useIntl } from '@payroll/quicksand';

// Harmony.css is hiding the section divider,
// this ensures it is always visible
const StyledModalActions = styled(ModalActions)`
  & hr {
    border-top-width: 1px;
  }

  & > div {
    display: flex;
    gap: 8px;
    justify-content: flex-end;

    /* Center align when only one button is present */
    button:only-child {
      margin-right: auto;
      margin-left: auto;
    }
  }
`;

const StyledModalHeader = styled(ModalHeader)`
  padding-bottom: 0 !important;
`;

const StyledImageWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

export interface ConfirmationModalProps {
  title?: string;
  size?: 'small' | 'medium' | 'large';
  image?: React.JSX.Element;
  open: boolean;
  children?: React.JSX.Element;
  noButtonLabel?: string;
  yesButtonLabel?: string;
  isLoading?: boolean;
  setOpen: (open: boolean) => void;
  onYesClick: () => void;
  onNoClick?: () => void;
  showNoButton?: boolean;
  showYesButton?: boolean;
  dismissible?: boolean;
  showSectionDivider?: boolean;
  actionAlignment?: 'center' | 'right';
  contentAlignment?: 'left' | 'center';
  headerAlignment?: 'left' | 'center';
}

const hasChildren = (children: JSX.Element | null | undefined) =>
  children !== null && children !== undefined && children.type;

export const ConfirmationModal = ({
  title,
  size = 'medium',
  image,
  open,
  children,
  noButtonLabel,
  yesButtonLabel,
  isLoading,
  setOpen,
  onYesClick,
  onNoClick,
  showNoButton = true,
  showYesButton = true,
  dismissible = false,
  showSectionDivider = true,
  actionAlignment = 'right',
  contentAlignment = 'left',
  headerAlignment = 'left',
}: ConfirmationModalProps) => {
  const intl = useIntl();

  const handleCloseModal = () => {
    setOpen(false);
  };

  const handleYesClick = () => {
    onYesClick();
  };

  const handleNoClick = () => {
    onNoClick?.();
    handleCloseModal();
  };

  return (
    <Modal
      data-testid="time-tracking-confirmation-modal"
      onClose={handleCloseModal}
      open={open}
      size={size}
      dismissible={dismissible}
      restoreFocus
    >
      <StyledModalHeader alignment={headerAlignment}>
        {image && (
          <StyledImageWrapper>
            <ModalImage image={image} size="large" />
          </StyledImageWrapper>
        )}
        <ModalTitle title={title} />
      </StyledModalHeader>
      {hasChildren(children) && (
        <ModalContent alignment={contentAlignment}>
          <div className="confirmation-modal-content">{children}</div>
        </ModalContent>
      )}
      <StyledModalActions
        alignment={actionAlignment}
        sectionDivider={showSectionDivider}
      >
        <>
          {showNoButton && (
            <Button
              priority="secondary"
              onClick={handleNoClick}
              disabled={isLoading}
            >
              {noButtonLabel || intl.formatMessage({ id: 'no' })}
            </Button>
          )}
          {showYesButton && (
            <Button
              priority="primary"
              onClick={handleYesClick}
              isLoading={isLoading}
              loadingComponent={<Activity shape="dots" size="small" />}
            >
              {yesButtonLabel || intl.formatMessage({ id: 'yes' })}
            </Button>
          )}
        </>
      </StyledModalActions>
    </Modal>
  );
};
