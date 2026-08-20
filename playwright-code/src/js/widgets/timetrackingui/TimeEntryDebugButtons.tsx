import SplitButton, { MenuItem } from '@ids-ts/split-button';
import React, { useState } from 'react';
import { useIntl } from '@payroll/quicksand';
import styled from 'styled-components';
import Widget from 'web-shell-core/widgets/HOCWidget';

const HeaderButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  gap: 5px;
`;

export const TimeEntryDebugButtons = () => {
  const intl = useIntl();

  const [isSingleTimeTrowserOpen, setIsSingleTimeTrowserOpen] = useState(false);
  const [isWeeklyTimeTrowserOpen, setIsWeeklyTimeTrowserOpen] = useState(false);

  const handleSplitButtonClick = () => {
    setIsSingleTimeTrowserOpen(true);
  };

  const handleSplitButtonSelect = (e: any) => {
    if (e.target.value === 'weekly') {
      setIsWeeklyTimeTrowserOpen(true);
    }
  };

  return (
    <>
      <HeaderButtonsContainer>
        <SplitButton
          label={intl.formatMessage({
            id: 'addtimeentry.button.label',
          })}
          onClick={handleSplitButtonClick}
          onSelect={handleSplitButtonSelect}
        >
          <MenuItem value="weekly">
            {intl.formatMessage({ id: 'addweeklytimeentry.button.label' })}
          </MenuItem>
        </SplitButton>
      </HeaderButtonsContainer>

      <Widget
        widgetId="time-tracking-ui/singleTimeTrowser"
        key={isSingleTimeTrowserOpen}
        open={isSingleTimeTrowserOpen}
        setOpen={setIsSingleTimeTrowserOpen}
      />

      <Widget
        widgetId="time-tracking-ui/weeklyTimeTrowser"
        key={isWeeklyTimeTrowserOpen}
        open={isWeeklyTimeTrowserOpen}
        setOpen={setIsWeeklyTimeTrowserOpen}
      />
    </>
  );
};
