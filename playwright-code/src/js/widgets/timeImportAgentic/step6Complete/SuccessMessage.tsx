import React from 'react';
import { B2, B3 } from '@ids-ts/typography';

interface SuccessMessageProps {
  hasFailedEntries?: boolean;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  hasFailedEntries = false,
}) => (
  <div style={{ textAlign: 'center', maxWidth: '400px' }}>
    <B2 weight="demi" style={{ marginBottom: '12px' }} as="div">
      {hasFailedEntries
        ? 'Time entries partially saved'
        : 'Time entries saved successfully'}
    </B2>
    <B3 style={{ marginBottom: '24px' }} as="div">
      {hasFailedEntries
        ? 'Some time entries could not be saved. You can export the failed entries to Excel for review.'
        : 'Your timesheet has been successfully imported into the system and is ready for use in your workflow.'}
    </B3>
  </div>
);

export default SuccessMessage;
