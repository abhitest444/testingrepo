import React from 'react';
import styled from 'styled-components';
import { useIntl } from '@payroll/quicksand';
import { B2, B3 } from '@ids-ts/typography';
import Link from '@ids-ts/link';
import NoOneOnClockImage from 'src/assets/images/NoOneOnClock.svg';
import Search from 'src/assets/images/Search.svg';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import type { DisplayByOption } from '../../types';
import { EMPLOYEE_LIST_REDIRECT_URL } from '../../constants/mapConstants';

const NoDataContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
  width: 100%;
  height: 100%;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  margin-top: 24px;
`;

interface NoDataStateProps {
  displayBy: DisplayByOption;
  searchText?: string;
}

/**
 * NoDataState Component
 * Displays appropriate empty state based on context:
 * - When displayBy is ON_CLOCK_ONLY or BY_GROUP: Shows "No one's on the clock" message
 * - When there's a search query with no results: Shows "Nothing matches" message,
 *   with an employee list link for non-WFS users and WFS users who are not
 *   employees or contractors
 */
export const NoDataState: React.FC<NoDataStateProps> = ({
  displayBy,
  searchText = '',
}) => {
  const intl = useIntl();
  const { data: shouldShowEmployeeListLink } = useQbTimeSdk<boolean>(
    (sdk) => sdk.shouldShowWhosWorkingEmployeeListLink,
    { executeOnMount: true },
  );
  // If user has a search query and no results
  if (searchText) {
    return (
      <NoDataContainer>
        <img
          alt={intl.formatMessage({
            id: 'whosWorking.noData.noSearchResultsImage',
          })}
          src={Search}
        />
        <TextContainer>
          <B2 weight="demi">
            {intl.formatMessage(
              { id: 'whosWorking.noData.noSearchResults' },
              { searchText },
            )}
          </B2>
          {shouldShowEmployeeListLink === true && (
            <B3>
              {intl.formatMessage({
                id: 'whosWorking.noData.lookingForOthers',
              })}{' '}
              <Link
                href={EMPLOYEE_LIST_REDIRECT_URL}
                type="inline"
                size="body-3"
              >
                {intl.formatMessage({
                  id: 'whosWorking.noData.employeeListLink',
                })}
              </Link>
            </B3>
          )}
        </TextContainer>
      </NoDataContainer>
    );
  }

  // For ON_CLOCK_ONLY or BY_GROUP display modes
  if (displayBy === 'ON_CLOCK_ONLY' || displayBy === 'BY_GROUP') {
    return (
      <NoDataContainer>
        <img
          src={NoOneOnClockImage}
          alt={intl.formatMessage({ id: 'whosWorking.noData.noOneOnClock' })}
        />
        <TextContainer>
          <B2 weight="demi">
            {intl.formatMessage({ id: 'whosWorking.noData.noOneOnClock' })}
          </B2>
        </TextContainer>
      </NoDataContainer>
    );
  }

  // Default empty state for ALL_EMPLOYEES
  return (
    <NoDataContainer>
      <TextContainer>
        <B2 weight="demi">
          {intl.formatMessage({ id: 'whosWorking.noData.noEmployees' })}
        </B2>
      </TextContainer>
    </NoDataContainer>
  );
};
