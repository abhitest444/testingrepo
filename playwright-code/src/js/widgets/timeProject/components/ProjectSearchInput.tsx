import React, { useCallback } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { SearchField } from '../../common/SearchField';
import { useLandingPageTrackingPoints } from '../hooks/useLandingPageTrackingPoints';
import { SearchItem } from './TimeProjectFilters.styled';

interface ProjectSearchInputProps {
  value: string;
  onChange: (text: string) => void;
}

const ProjectSearchInput: React.FC<ProjectSearchInputProps> = ({
  value,
  onChange,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const text = (id: string) => intl.formatMessage({ id });
  const trackingPoints = useLandingPageTrackingPoints();

  const handleChange = useCallback(
    (text: string) => {
      track(trackingPoints.CLICK_SEARCH_ICON);
      onChange(text);
    },
    [onChange, track, trackingPoints],
  );

  return (
    <SearchItem data-testid="time-project-search">
      <SearchField
        value={value}
        onChange={handleChange}
        label={text('timeProject.filter.searchLabel')}
        placeholder={text('timeProject.filter.searchPlaceholder')}
      />
    </SearchItem>
  );
};

export default ProjectSearchInput;
