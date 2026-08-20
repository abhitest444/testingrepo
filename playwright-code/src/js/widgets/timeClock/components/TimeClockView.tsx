import React, { useState } from 'react';
import { Drawer, DrawerContent } from '@ids-ts/drawer';
import { TimeClockError } from 'src/js/widgets/timeClock/components/TimeClockError';

interface TimeClockViewProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TimeClockView: React.FC<TimeClockViewProps> = ({ open, setOpen }) => {
  const [error, setError] = useState<Error | null>(null);
  const [showError, setShowError] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setShowError(false);
  };

  return (
    <Drawer open={open} onClose={handleClose}>
      <DrawerContent>
        {showError && (
          <TimeClockError
            isOpen={showError}
            onClose={() => setShowError(false)}
            titleId="timeclock.error.title"
            messageId="timeclock.error.message"
          />
        )}
        {/* ... rest of the drawer content */}
      </DrawerContent>
    </Drawer>
  );
};

export default TimeClockView;
