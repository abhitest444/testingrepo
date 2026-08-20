import React from 'react';
import styled from 'styled-components';
import { DrawerHeader, DrawerContent, DrawerFooter } from '@ids-ts/drawer';
import Button from '@ids-ts/button';
import { useIntl } from '@payroll/quicksand';

const DRAWER_FOOTER_COLOR = '#FFFFFF';

const StyledDrawerHeader = styled(DrawerHeader)`
  box-shadow: #00000040 0px 2px 2px;
  padding: 0 10px;
  font-weight: var(--font-weight-component-semibold);
`;

const StyledGoBackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
`;

const StyledBackHeader = styled.h3`
  font-size: var(--font-size-heading-3);
  font-weight: var(--font-weight-heading);
`;

const StyledBackDescription = styled.div`
  font-size: var(--font-size-component-small);
`;

interface TimeClockCloseConfirmationProps {
  onBack: () => void;
  onClose: () => void;
  header?: string;
  description?: string;
  backButtonLabel?: string;
  closeButtonLabel?: string;
  drawerTitle?: string;
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  onPrimaryButtonClick?: () => void;
  onSecondaryButtonClick?: () => void;
  variant?: 'save' | 'stay';
}

const TimeClockCloseConfirmation: React.FC<TimeClockCloseConfirmationProps> = ({
  onBack,
  onClose,
  header,
  description,
  backButtonLabel,
  drawerTitle,
  primaryButtonLabel,
  secondaryButtonLabel,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  variant = 'save',
}) => {
  const intl = useIntl();

  const getButtonConfig = () => {
    if (variant === 'save') {
      return {
        primary: {
          label: primaryButtonLabel,
          onClick: onPrimaryButtonClick || onClose,
          purpose: 'standard' as const,
        },
        secondary: {
          label: secondaryButtonLabel,
          onClick: onSecondaryButtonClick || onBack,
          purpose: 'standard' as const,
          priority: 'secondary' as const,
        },
      };
    }
    return {
      primary: {
        label: primaryButtonLabel,
        onClick: onPrimaryButtonClick || onClose,
        purpose: 'standard' as const,
      },
      secondary: {
        label: secondaryButtonLabel,
        onClick: onSecondaryButtonClick || onBack,
        purpose: 'standard' as const,
        priority: 'secondary' as const,
      },
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <>
      <DrawerHeader
        backActionLabel={backButtonLabel}
        onBackActionClick={onBack}
        onClose={onClose}
        title={
          drawerTitle ||
          intl.formatMessage({
            id: 'timeclock.header',
          })
        }
      />
      <DrawerContent>
        <StyledGoBackContainer>
          <StyledBackHeader>{header}</StyledBackHeader>
          <StyledBackDescription>{description}</StyledBackDescription>
        </StyledGoBackContainer>
      </DrawerContent>
      <DrawerFooter
        color={DRAWER_FOOTER_COLOR}
        footerPrimaryAction={
          <Button
            purpose={buttonConfig.primary.purpose}
            onClick={buttonConfig.primary.onClick}
            data-test-id="time-clock-confirm-close-button"
          >
            {buttonConfig.primary.label}
          </Button>
        }
        footerSecondaryAction={
          <Button
            purpose={buttonConfig.secondary.purpose}
            priority={buttonConfig.secondary.priority}
            onClick={buttonConfig.secondary.onClick}
            data-test-id="time-clock-confirm-back-button"
          >
            {buttonConfig.secondary.label}
          </Button>
        }
      />
    </>
  );
};

export default TimeClockCloseConfirmation;
