/**
 * KioskSettingModal — generic, prop-driven kiosk settings modal.
 * =============================================================================
 * A single reusable modal for editing one kiosk setting at a time. It is
 * intentionally presentational and field-agnostic: callers pass a discriminated
 * `field` describing the input to render (number today; checkbox scaffolded for
 * future settings such as location recording). All Redux/persistence logic lives
 * in the caller (e.g. KioskSettingsModalsContainer), so this component stays
 * reusable across every kiosk setting modal.
 */
import React from 'react';
import {
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@ids-ts/modal-dialog';
import Button from '@ids-ts/button';
import Typography from '@ids-ts/typography';
import TextField from '@ids-ts/text-field';
import { Checkbox, CheckboxOnChangeEventType } from '@ids-ts/checkbox';
import { Activity } from '@ids-ts/loader';
import {
  CheckboxWrapper,
  ContentColumn,
  ErrorPageMessage,
  FieldRow,
  NumberFieldWrapper,
} from '../styles/KioskSettingModal.styled';
import { KioskSettingModalProps } from '../types/TimeKiosk.types';

const KioskSettingModal: React.FC<KioskSettingModalProps> = ({
  open,
  title,
  description,
  field,
  onSave,
  onClose,
  isSaving = false,
  saveDisabled = false,
  saveLabel,
  cancelLabel,
  errorMessage,
  dataTestId = 'kiosk-setting-modal',
}) => {
  // function to handle the close of the modal
  const handleClose = () => {
    // if the modal is not in saving state, close the modal
    // this is done to ensure that the modal is not closed if the user is still saving the settings
    // this helps prevent the user from closing the modal and losing their changes
    if (!isSaving) {
      onClose();
    }
  };

  const renderField = () => {
    switch (field.kind) {
      // Number field is for inactivity timer kiosk modal
      case 'number':
        return (
          <FieldRow>
            <NumberFieldWrapper>
              <TextField
                type="number"
                min={field.min ?? 1}
                max={field.max ?? 90}
                inputMode="numeric"
                value={field.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.onChange(e.target.value)
                }
                placeholder={field.placeholder}
                aria-label={field.ariaLabel}
                data-testid="kiosk-setting-modal-number-field"
              />
            </NumberFieldWrapper>
            {field.suffixLabel && (
              <Typography variant="body-2" weight="regular">
                {field.suffixLabel}
              </Typography>
            )}
          </FieldRow>
        );
      // Checkbox field is for location recording kiosk modal
      case 'checkbox':
        return (
          <CheckboxWrapper>
            <Checkbox
              checked={field.checked}
              onChange={(e: CheckboxOnChangeEventType) =>
                field.onChange(e.target.checked || false)
              }
              data-testid="kiosk-setting-modal-checkbox"
            >
              {field.label}
            </Checkbox>
          </CheckboxWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="kiosk-setting-modal-title"
      data-testid={dataTestId}
      size="small"
      dismissible
    >
      <ModalHeader
        alignment="left"
        dismissible
        onClose={handleClose}
        id="kiosk-setting-modal-title"
        data-testid={`${dataTestId}-header`}
      >
        <ModalTitle title={title} />
      </ModalHeader>
      <ModalContent alignment="left" data-testid={`${dataTestId}-content`}>
        <ContentColumn>
          {errorMessage && (
            <ErrorPageMessage
              type="error"
              title={errorMessage}
              open
              dismissible={false}
              data-testid={`${dataTestId}-error`}
            />
          )}
          {description && (
            <Typography variant="body-2" weight="regular">
              {description}
            </Typography>
          )}
          {renderField()}
        </ContentColumn>
      </ModalContent>
      <ModalActions
        alignment="right"
        sectionDivider
        data-testid={`${dataTestId}-actions`}
      >
        <Button
          priority="secondary"
          onClick={handleClose}
          disabled={isSaving}
          data-testid={`${dataTestId}-cancel`}
        >
          {cancelLabel}
        </Button>
        <Button
          priority="primary"
          onClick={onSave}
          disabled={isSaving || saveDisabled}
          isLoading={isSaving}
          loadingComponent={<Activity shape="dots" size="small" />}
          data-testid={`${dataTestId}-save`}
        >
          {saveLabel}
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default KioskSettingModal;
