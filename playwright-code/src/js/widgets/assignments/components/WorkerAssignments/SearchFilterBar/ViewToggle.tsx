import React from 'react';
import { Person, PersonThree } from '@design-systems/icons';
import Toggle from '@qbds/toggle';
import { useIntl } from '@payroll/quicksand';
import { ViewType, type ViewToggleProps } from './types';
import { StyledToggleWrapper } from '../../styles/SearchFilterBar.styled';

/**
 * ViewToggle Component
 *
 * Toggle control for switching between "Workers" and "Groups" view
 * Uses QBDS Toggle component with icons and labels
 */
export const ViewToggle: React.FC<ViewToggleProps> = ({
  checked,
  onChange,
}) => {
  const intl = useIntl();

  const toggleOptions = [
    {
      icon: <Person />,
      label: intl.formatMessage({
        id: 'workers.viewToggle.workers',
        defaultMessage: 'Workers',
      }),
      value: ViewType.WORKERS,
    },
    {
      icon: <PersonThree />,
      label: intl.formatMessage({
        id: 'workers.viewToggle.groups',
        defaultMessage: 'Groups',
      }),
      value: ViewType.GROUPS,
    },
  ];

  const handleChange = (value: string) => {
    onChange(value === ViewType.GROUPS);
  };

  return (
    <StyledToggleWrapper>
      <Toggle
        groupLabel={intl.formatMessage({
          id: 'workers.viewToggle.ariaLabel',
          defaultMessage: 'Toggle view by workers or groups',
        })}
        options={toggleOptions}
        defaultValue={checked ? ViewType.GROUPS : ViewType.WORKERS}
        overrideValue={checked ? ViewType.GROUPS : ViewType.WORKERS}
        variant="icon-label"
        size="standard"
        onChange={handleChange}
      />
    </StyledToggleWrapper>
  );
};
