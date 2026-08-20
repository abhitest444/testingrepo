import React from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@ids-ts/button';
import { exportTimeEntriesToExcel } from '../utils/excelExport';

interface ExportButtonProps {
  onStartOver: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onStartOver }) => {
  const timeEntries = useSelector(
    (state: any) => state.review.timeEntries || [],
  );
  const failedEntries = useSelector(
    (state: any) => state.review.failedEntries || [],
  );

  const handleExport = () => {
    // Export failed entries if available, otherwise all time entries
    const entriesToExport =
      failedEntries.length > 0 ? failedEntries : timeEntries;
    exportTimeEntriesToExcel(entriesToExport, 'time_entries.xlsx');
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        width: '100%',
        maxWidth: '400px',
      }}
    >
      <Button
        priority="secondary"
        purpose="standard"
        theme="gbsgexperimental"
        onClick={onStartOver}
      >
        Start Over
      </Button>

      <Button
        priority="primary"
        purpose="standard"
        theme="gbsgexperimental"
        onClick={handleExport}
      >
        Export to Excel
      </Button>
    </div>
  );
};

export default ExportButton;
