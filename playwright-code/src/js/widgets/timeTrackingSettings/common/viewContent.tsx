/* eslint-disable no-nested-ternary */
import React from 'react';
import styled from 'styled-components';
import { useIntl, useSandbox } from '@payroll/quicksand';
import Badge, { WarningBadgeIcon } from '@ids-ts/badge';

import { Button } from '@ids-ts/button';
import { Plus } from '@design-systems/icons';
import { ReactComponent as LinkIcon } from 'src/assets/images/Link.svg';

import {
  FieldOption,
  IFormConfig,
  sanitize,
} from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import {
  IconSize,
  CustomFieldActions,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { canEditPreference } from 'src/js/service/utils/sandboxUtils';
import { renderTitleWithBadge } from 'src/js/hooks/useRenderTitleWithBadge';

export const SectionContainer = styled.div`
  display: flex;
  flex-flow: column;
`;

export const StyledRow = styled.div<{ isErrorRow: boolean }>`
  display: flex;
  align-items: ${({ isErrorRow }) => (isErrorRow ? 'center' : 'flex-start')};
  gap: ${({ isErrorRow }) => (isErrorRow ? '12px' : '24px')};
  min-height: 40px;
  padding: 8px 0;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-divider-tertiary);

    &:last-child {
      border-bottom: none;
    }
  }
`;

export const FlexColumnContainer = styled.div`
  display: flex;
  flex-flow: column;
  gap: 32px;

  & > ${SectionContainer}:first-child > ${StyledRow}:first-child {
    padding-top: 0;
  }
`;

export const Label = styled.label`
  width: 380px;
  font-weight: var(--font-weight-input-label);
  color: var(--color-text-primary);
  line-height: 1.4;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    font-size: var(--font-size-input-label);
    margin-bottom: 4px;
    color: var(--color-input-label);
  }
`;

export const Value = styled.span`
  font-weight: var(--font-weight-component-bold);
  color: var(--color-text-primary);
  line-height: 1.4; /* (NoTokenFound) */
  flex: 1;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;

  @media (max-width: 768px) {
    width: 100%;
    font-size: var(--font-size-component-medium);
    font-weight: var(--font-weight-component-bold);
    color: var(--color-text-primary);
    padding-left: 0;
    margin-top: 0;
  }
`;

export const BoldLabel = styled.label<{ index: number }>`
  width: 100%;
  font-weight: var(--font-weight-component-bold);
  color: var(--color-text-primary);
  font-size: var(--font-size-component-medium);
  line-height: 1.4; /* (NoTokenFound) */
  margin-top: ${({ index }) => (index > 0 ? '16px' : '0px')};
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 18px;
    margin-top: ${({ index }) => (index > 0 ? '24px' : '16px')};
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--color-divider-tertiary);
  }
`;

const MenuButton = styled(Button)`
  margin-left: -5px;
`;

interface IGeneralTimeTrackingSettings {
  formFields: IFormConfig;
  isErrorInView?: boolean;
  sectionErrors?: {
    [key: string]: {
      hasError: boolean;
      errorMessageKey?: string;
    };
  };
  sectionBadges?: {
    [key: string]: {
      isVisible: boolean;
      visibilityEndDate?: string;
    };
  };
}

export const ViewContent: React.FC<IGeneralTimeTrackingSettings> = ({
  formFields,
  isErrorInView = false,
  sectionErrors = {},
  sectionBadges = {},
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const text = (id: string) => intl.formatMessage({ id });

  /**
   * `field.value` may be an NLS id (e.g. time-tracking / approval rows) or pre-formatted
   * localized text from upstream (e.g. NotificationsTimeEntrySettings). For the latter,
   * `formatMessage` falls back to `defaultMessage` so the string still displays when it is
   * not a catalog key.
   */
  const resolveFieldValueDisplay = (
    raw: string | boolean | undefined | null,
  ): string => {
    const safe = sanitize(raw);
    if (!safe) {
      return '';
    }
    return intl.formatMessage({ id: safe, defaultMessage: safe });
  };

  const formatSubFields = (subFields: FieldOption[]) =>
    subFields
      .map(
        (sf: FieldOption) =>
          ` ${text(sf.title).toLocaleLowerCase()} ${resolveFieldValueDisplay(
            sf.value,
          ).toLocaleLowerCase()}`,
      )
      .join(',');

  /**
   * This function is used to get the icon based on the action.
   */
  const getIcon = (icon: string, iconSize: IconSize = IconSize.SMALL) => {
    switch (icon) {
      case CustomFieldActions.ADD:
        return <Plus size={iconSize} />;
      case CustomFieldActions.MANAGE:
        return <LinkIcon size={iconSize} />;
      default:
        return null;
    }
  };

  const renderFields = (fields: FieldOption[], sectionKey: string) => {
    const results: JSX.Element[] = [];
    let currentSectionHasError = false;
    let currentSectionHeaderKey = '';

    fields.forEach((field, index) => {
      if (!field.isVisible) return;

      // Check if this is a section header
      const isSectionHeader =
        Object.keys(field).indexOf('isEditable') !== -1 && !field.isEditable;

      if (isSectionHeader) {
        // Check if there's an error for this specific section header
        const sectionError = sectionErrors[field.key];
        currentSectionHasError = sectionError?.hasError || false;
        currentSectionHeaderKey = field.key;

        // Check if there's a badge for this section
        const sectionBadge = sectionBadges[field.key];
        const titleWithBadge = renderTitleWithBadge({
          title: field.title,
          isNew: sectionBadge?.isVisible,
          isNewVisibleTill: sectionBadge?.visibilityEndDate,
          intl,
        });

        // Add the section header
        results.push(
          <StyledRow
            isErrorRow={false}
            key={field.id}
            data-testid={field.automationId}
          >
            <BoldLabel index={index}>{titleWithBadge}</BoldLabel>
          </StyledRow>,
        );

        // If there's an error, show it after the header and skip subsequent fields until next header
        if (currentSectionHasError) {
          results.push(
            <div key={`${field.id}-error`}>
              {RenderErrorSection(sectionError?.errorMessageKey)}
            </div>,
          );
        }
        return;
      }

      // Skip rendering fields if current section has error
      if (currentSectionHasError) {
        return;
      }

      if (field?.menuButton) {
        results.push(
          <StyledRow
            isErrorRow={false}
            key={field.id}
            data-testid={field.automationId}
          >
            <MenuButton
              priority={field.menuButton.priority}
              purpose={field.menuButton.purpose}
              size={field.menuButton.size}
              onClick={field.menuButton.onClick}
              data-testid={field.menuButton.automationId}
            >
              {text(field.menuButton.label)}
              {field.menuButton?.icon &&
                getIcon(field.menuButton?.icon, field.menuButton?.iconSize)}
            </MenuButton>
          </StyledRow>,
        );
      } else {
        results.push(
          <StyledRow
            isErrorRow={false}
            key={field.id}
            data-testid={field.automationId}
          >
            <Label>{text(field.title)}</Label>

            <Value>
              {field.subFields &&
              field.subFields.length &&
              field.subFields.length > 0 &&
              field.value
                ? `${resolveFieldValueDisplay(field.value)},${formatSubFields(
                    field.subFields,
                  )}`
                : field.value
                ? resolveFieldValueDisplay(field.value)
                : ''}
            </Value>
          </StyledRow>,
        );
      }
    });

    return results;
  };

  const RenderErrorSection = (errorMessageKey?: string) => (
    <>
      <StyledRow isErrorRow>
        <>
          <Badge aria-label="Warning" shape="round" status="warning">
            <WarningBadgeIcon />
          </Badge>
          <span>
            {!canEditPreference(sandbox)
              ? text('do.not.have.access.rights.to.edit.time.settings')
              : errorMessageKey
              ? text(errorMessageKey)
              : text('time-entries.validation.ql.fail')}
          </span>
        </>
      </StyledRow>
    </>
  );

  return (
    <FlexColumnContainer>
      {isErrorInView ? (
        RenderErrorSection()
      ) : (
        <>
          {Object.keys(formFields).map((key) => {
            const fields = formFields[key];

            return (
              <SectionContainer key={key}>
                {renderFields(fields, key)}
              </SectionContainer>
            );
          })}
        </>
      )}
    </FlexColumnContainer>
  );
};
