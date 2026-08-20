import React from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@ids-ts/button';
import { B2, B3 } from '@ids-ts/typography';
import { CircleExclamationFill } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';
import { exportTimeEntriesToExcel } from '../utils/excelExport';

const FailureScreen: React.FC = () => {
  const saveError = useSelector((state: any) => state.review.saveError);
  const isInitialLoadError = useSelector(
    (state: any) => state.review.isInitialLoadError,
  );
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
    exportTimeEntriesToExcel(entriesToExport, 'failed_time_entries.xlsx');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        alignItems: 'center',
      }}
    >
      {/* Failure Icon */}
      <CircleExclamationFill size="xxlarge" />

      {/* Title */}
      <B2 weight="demi" style={{ marginBottom: '12px' }}>
        Something went wrong
      </B2>

      {/* Description - different based on error type */}
      <B2
        style={{
          textAlign: 'center',
          marginBottom: '24px',
          maxWidth: '400px',
        }}
      >
        {isInitialLoadError
          ? 'We encountered an error loading the required data. Please try again.'
          : 'There was an error saving your time entries. As of now you can download the failed entries to Excel for review.'}
      </B2>

      {/* Error Details */}
      {saveError && (
        <B3
          style={{
            color: '#dc3545',
            textAlign: 'center',
            marginBottom: '12px',
            maxWidth: '500px',
            padding: '12px',
            backgroundColor: '#f8d7da',
            borderRadius: '4px',
          }}
        >
          {saveError}
        </B3>
      )}

      {/* Action Button - only show export for time entry save errors */}
      {!isInitialLoadError && (
        <Button
          priority="primary"
          purpose="standard"
          theme="gbsgexperimental"
          onClick={handleExport}
        >
          Export failed time entries
        </Button>
      )}
    </div>
  );
};

export default FailureScreen;
