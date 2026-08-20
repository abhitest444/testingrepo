import React from 'react';
import { Button } from '@ids-ts/button';

interface CompleteButtonProps {
  onComplete: () => void;
}

const CompleteButton: React.FC<CompleteButtonProps> = ({ onComplete }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '24px',
      width: '100%',
      maxWidth: '400px',
    }}
  >
    <Button
      priority="primary"
      purpose="standard"
      theme="gbsgexperimental"
      onClick={onComplete}
    >
      Complete
    </Button>
  </div>
);

export default CompleteButton;
