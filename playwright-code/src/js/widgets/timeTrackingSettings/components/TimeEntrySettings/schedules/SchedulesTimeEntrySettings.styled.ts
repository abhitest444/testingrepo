import styled from 'styled-components';

// Counteracts payroll edit panel `align-items: center`
// only schedules settings uses inline EDIT in time settings
export const SchedulesEditSurface = styled.div`
  align-self: stretch;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

export const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const RadioStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
