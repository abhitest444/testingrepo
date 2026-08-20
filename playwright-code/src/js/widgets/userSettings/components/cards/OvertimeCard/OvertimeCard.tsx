import React from 'react';
import { useAppSelector } from 'src/js/widgets/userSettings/store';
import { selectOvertimeMode } from 'src/js/widgets/userSettings/store/slices/overtimeSlice';
import OvertimeCardView from './components/OvertimeCardView';
import OvertimeCardEdit from './components/OvertimeCardEdit';
import { OvertimeCardMode } from './types/OvertimeCard.types';

interface OvertimeCardProps {
  overtimeBadgeVisibilityEndDate?: string;
}

/**
 * OvertimeCard component
 *
 * Data is fetched and synced to Redux by useOvertimeCardData hook in UserSettingsPage.
 * This component reads directly from Redux store.
 *
 * initializeEditDraft is dispatched synchronously in OvertimeCardView's pencil onClick
 * so Redux draft state is ready before OvertimeCardEdit first renders.
 */
const OvertimeCard: React.FC<OvertimeCardProps> = ({
  overtimeBadgeVisibilityEndDate = '',
}) => {
  const mode = useAppSelector(selectOvertimeMode);

  if (mode === OvertimeCardMode.VIEW) {
    return (
      <OvertimeCardView
        overtimeBadgeVisibilityEndDate={overtimeBadgeVisibilityEndDate}
      />
    );
  }

  return <OvertimeCardEdit />;
};

export default OvertimeCard;
