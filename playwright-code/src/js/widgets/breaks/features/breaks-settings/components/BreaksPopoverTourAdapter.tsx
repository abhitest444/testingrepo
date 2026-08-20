import React, { useState, useEffect } from 'react';
import GeneralPopoverTour, {
  GeneralPopoverTourStep,
} from 'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour';
import { BreakTourSteps } from 'src/js/common/tourSteps';

interface BreaksPopoverTourAdapterProps {
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

const BreaksPopoverTourAdapter: React.FC<BreaksPopoverTourAdapterProps> = ({
  open = false,
  onClose,
  onFinish,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const steps = BreakTourSteps();

  useEffect(() => {
    if (open && steps.length > 0) {
      const el = document.querySelector(
        steps[0].targetSelector!,
      ) as HTMLElement;
      setAnchorEl(el);
    } else {
      setAnchorEl(null);
    }
  }, [open, steps]);

  const tourSteps: GeneralPopoverTourStep[] = anchorEl
    ? [{ ...steps[0], anchorEl }]
    : [];

  return open && anchorEl ? (
    <GeneralPopoverTour
      open={open}
      steps={tourSteps}
      onClose={onClose}
      onFinish={onFinish}
    />
  ) : null;
};

export default BreaksPopoverTourAdapter;
