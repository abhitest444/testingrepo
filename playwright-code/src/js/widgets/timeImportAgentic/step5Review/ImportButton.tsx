import React from 'react';
import { B3 } from '@ids-ts/typography';
import { Button } from '@ids-ts/button';

interface ImportButtonProps {
  isImporting: boolean;
  onImport: () => void;
  onStartOver: () => void;
}

const ImportButton: React.FC<ImportButtonProps> = ({
  isImporting,
  onImport,
  onStartOver,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px',
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

    {isImporting ? (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 24px',
          backgroundColor: '#f8f9ff',
          borderRadius: '8px',
          border: '1px solid #e1e5e9',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid #4A90E2',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <B3>Importing timesheet data...</B3>
      </div>
    ) : (
      <Button
        priority="primary"
        purpose="standard"
        theme="gbsgexperimental"
        onClick={onImport}
      >
        Import
      </Button>
    )}
  </div>
);

export default ImportButton;
