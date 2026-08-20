import React from 'react';
import { B3, Demi } from '@ids-ts/typography';

interface AssignmentSummaryProps {
  selectedCount: number;
  totalCount: number;
  fieldName?: string;
  summaryType: string; // NLS text for the type (customers, team members, etc.)
  hasChanges?: boolean;
  changeCount?: number;
}

const AssignmentSummary: React.FC<AssignmentSummaryProps> = ({
  selectedCount,
  totalCount,
  fieldName = 'Region',
  summaryType,
  hasChanges = false,
  changeCount = 0,
}) => {
  const renderSummary = () => (
    // Standard format: "{selected} of {total} {type} assigned to {fieldName}"
    <>
      <Demi>
        {selectedCount} of {totalCount} {summaryType}
      </Demi>{' '}
      assigned to <Demi>{fieldName}</Demi>
    </>
  );
  return <B3>{renderSummary()}</B3>;
};

export default AssignmentSummary;
