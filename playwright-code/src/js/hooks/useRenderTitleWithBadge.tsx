import React from 'react';
import { useIntl } from '@payroll/quicksand';
import styled from 'styled-components';
import Badge from '@ids-ts/badge';
import dayjs from 'dayjs';

const StyledTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 4px;
  }

  @media (max-width: 480px) {
    gap: 4px;
    align-items: flex-start;

    span {
      font-size: var(--font-size-component-small);
      line-height: var(--line-height-component);
      word-break: break-word;
      flex: 1;
      min-width: 0;
    }
  }
`;

interface RenderTitleWithBadgeProps {
  title: string;
  isNew?: boolean;
  isNewVisibleTill?: string;
  intl: any;
}

/**
 * Utility function to render titles with conditional "new" badges
 * @param title - The title message ID to be formatted
 * @param isNew - Whether the item is marked as new
 * @param isNewVisibleTill - Date until which the "new" badge should be visible
 * @param intl - Internationalization object from useIntl hook
 * @returns JSX element with title and optional "new" badge
 */
export const renderTitleWithBadge = ({
  title,
  isNew = false,
  isNewVisibleTill = '',
  intl,
}: RenderTitleWithBadgeProps) => {
  const shouldShowNewBadge =
    isNew &&
    isNewVisibleTill &&
    dayjs(isNewVisibleTill).isValid() &&
    dayjs().isBefore(dayjs(isNewVisibleTill));

  if (shouldShowNewBadge) {
    return (
      <StyledTitle>
        <span>{intl.formatMessage({ id: title })}</span>
        <Badge capitalization="sentence" priority="secondary" status="new">
          {intl.formatMessage({ id: 'new', defaultMessage: 'New' })}
        </Badge>
      </StyledTitle>
    );
  }

  return intl.formatMessage({ id: title });
};

/**
 * Hook version of renderTitleWithBadge that includes useIntl internally
 * @param title - The title message ID to be formatted
 * @param isNew - Whether the item is marked as new
 * @param isNewVisibleTill - Date until which the "new" badge should be visible
 * @returns JSX element with title and optional "new" badge
 */
export const useRenderTitleWithBadge = (
  title: string,
  isNew?: boolean,
  isNewVisibleTill?: string,
) => {
  const intl = useIntl();

  return renderTitleWithBadge({
    title,
    isNew,
    isNewVisibleTill,
    intl,
  });
};
