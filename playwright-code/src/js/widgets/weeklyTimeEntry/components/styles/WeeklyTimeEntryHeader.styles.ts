import styled from 'styled-components';

export const HeaderWrapper = styled.div`
  display: flex;
  background-color: var(--color-container-background-primary);
  height: 60px;
  margin-bottom: 20px;
  justify-content: space-between;
`;

export const LeftSection = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 24px;
  flex: 1 !important;

  & .QuickfillsEntity {
    & > div > div > div {
      display: none !important;
    }
  }
`;

export const RightSection = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;
`;

export const TeamMemberDropdownContainer = styled.div`
  width: 200px;
`;

export const DateRangePickerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  & #weekly-date-input > div {
    width: 0 !important;
    margin: 0 45px 0 0 !important;
  }
  & #weekly-date-input input,
  & #weekly-date-input input:hover,
  & #weekly-date-input input:active,
  & #weekly-date-input input:focus {
    width: 0 !important;
    border: 0 !important;
    outline: none !important;
    box-shadow: unset !important;
    cursor: pointer !important;
  }
  & #weekly-date-input button {
    left: 10px;
    top: 3px;
  }
`;
