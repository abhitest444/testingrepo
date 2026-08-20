import React from 'react';
import styled from 'styled-components';
import TextField from '@ids-ts/text-field';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { BREAK_LOGGING_CONSTANTS } from '../../../../constants';

interface AssignTeamMembersSearchProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchContainer = styled.div`
  margin-bottom: 16px;
`;

const StyledInput = styled(TextField)`
  width: 100%;
`;

const AssignTeamMembersSearch: React.FC<AssignTeamMembersSearchProps> = ({
  value,
  onChange,
}) => {
  const logger = useLoggingConfig();

  const handleSearchChange = (searchValue: string) => {
    if (searchValue !== value) {
      logger.info(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.TEAM_MEMBERS_SEARCH_PERFORMED,
        {
          searchTerm: searchValue,
          searchTermLength: searchValue.length,
        },
      );
    }
    onChange(searchValue);
  };

  return (
    <SearchContainer>
      <StyledInput
        placeholder="Search team member"
        value={value}
        onChange={(e) => handleSearchChange(e.target.value)}
        aria-label="Search team member"
        width="100%"
      />
    </SearchContainer>
  );
};

export default AssignTeamMembersSearch;
