// @ts-nocheck
import React, { useEffect } from 'react';
import { useSandbox } from '@payroll/quicksand';
import BreaksCardView from './components/BreaksCardView';

// Fast follow - edit functionality imports
// import { BreaksCardMode } from '../../../store/slices/breaksSlice';
// import { useAppDispatch, useAppSelector } from '../../../store';
// import { setBreaksMode, selectBreaksMode } from '../../../store/slices/breaksSlice';
// import BreaksCardEdit from './components/BreaksCardEdit';

// For now, only VIEW mode is implemented
// EDIT mode will be added later following the NotificationsCard pattern

// Fast follow - full component with mode switching:
// const BreaksCard: React.FC = () => {
//   const dispatch = useAppDispatch();
//   const mode = useAppSelector(selectBreaksMode);
//
//   if (mode === BreaksCardMode.EDIT) {
//     return <BreaksCardEdit />;
//   }
//
//   return <BreaksCardView />;
// };

const BreaksCard: React.FC = () => {
  const sandbox = useSandbox();

  useEffect(() => {
    sandbox.logger.info(
      'Component=BreaksCard Event=Breaks user settings viewed',
    );
  }, [sandbox.logger]);

  return <BreaksCardView />;
};

export default BreaksCard;
