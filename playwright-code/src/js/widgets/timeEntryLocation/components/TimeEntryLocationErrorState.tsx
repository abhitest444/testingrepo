import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useIntl, useTracking } from '@payroll/quicksand';
import { B1, B2 } from '@ids-ts/typography';
import { ReactComponent as SomethingWentWrong } from 'src/assets/images/SomethingWentWrong.svg';
import { LOCATION_MAP_TRACKING_POINTS } from '../utils/locationMapTrackingPoints';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 48px 24px;
  gap: var(--space-medium, 16px);
`;

const Illustration = styled(SomethingWentWrong)`
  width: 240px;
  height: 176px;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-x-small, 8px);
  text-align: center;
`;

const ErrorTitle = styled(B1)`
  margin: 0;
`;

const ErrorMessage = styled(B2)`
  margin: 0;
  color: #6b6c72;
`;

const TimeEntryLocationErrorState: React.FC = () => {
  const intl = useIntl();
  const track = useTracking();
  const text = (id: string) => intl.formatMessage({ id });

  // Track the error state when something went wrong page is viewed
  useEffect(() => {
    track(LOCATION_MAP_TRACKING_POINTS.SOMETHING_WENT_WRONG_VIEWED);
  }, [track]);

  return (
    <ErrorContainer data-testid="time-entry-location-error-state">
      <Illustration aria-hidden="true" />
      <TextContainer>
        <ErrorTitle weight="demi">
          {text('timeEntryLocation.error.title')}
        </ErrorTitle>
        <ErrorMessage weight="medium" color="var(--color-text-secondary)">
          {text('timeEntryLocation.error.message')}
        </ErrorMessage>
      </TextContainer>
    </ErrorContainer>
  );
};

export default TimeEntryLocationErrorState;
