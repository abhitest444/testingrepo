import React from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@ids-ts/button';
import { useIntl } from '@payroll/quicksand';
import { openBreakEntryForm } from '../../../store/breakEntriesSlice';

interface BreakEntryTriggerProps {
  assigneeId: string;
}

const BreakEntryTrigger: React.FC<BreakEntryTriggerProps> = ({
  assigneeId,
}) => {
  const dispatch = useDispatch();
  const intl = useIntl();

  const handleOpenForm = () => {
    dispatch(openBreakEntryForm());
  };

  return (
    <Button onClick={handleOpenForm}>
      {intl.formatMessage(
        { id: 'breaks.entry.trigger.button' },
        { defaultValue: 'Add Break Entry' },
      )}
    </Button>
  );
};

export default BreakEntryTrigger;
