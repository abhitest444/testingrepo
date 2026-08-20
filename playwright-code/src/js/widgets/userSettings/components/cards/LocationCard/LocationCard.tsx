// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useAppSelector } from 'src/js/widgets/userSettings/store';
import { selectLocationMode } from 'src/js/widgets/userSettings/store/slices/locationSlice';
import LocationCardView from './components/LocationCardView';
import LocationCardEdit from './components/LocationCardEdit';
import { LocationCardMode } from './types/LocationCard.types';

interface LocationCardProps {
  showActions?: boolean;
}

/**
 * LocationCard component
 *
 * Data is fetched and synced to Redux by the unified fetch in UserSettingsPage.
 * This component reads directly from Redux store.
 */
const LocationCard: React.FC<LocationCardProps> = ({ showActions = true }) => {
  const sandbox = useSandbox();
  const mode = useAppSelector(selectLocationMode);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    sandbox.logger.info(
      'Component=LocationCard Event=Location user settings viewed',
    );
  }, [sandbox.logger]);

  const handleSaveSuccess = () => {
    setShowSuccessToast(true);
  };

  const handleCloseSuccessToast = () => {
    setShowSuccessToast(false);
  };

  if (mode === LocationCardMode.VIEW) {
    return (
      <LocationCardView
        showActions={showActions}
        showSuccessToast={showSuccessToast}
        onCloseSuccessToast={handleCloseSuccessToast}
      />
    );
  }

  return <LocationCardEdit onSaveSuccess={handleSaveSuccess} />;
};

export default LocationCard;
