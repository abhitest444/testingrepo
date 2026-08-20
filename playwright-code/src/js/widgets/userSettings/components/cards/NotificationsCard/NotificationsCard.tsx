// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useAppSelector } from '../../../store';
import { selectNotificationsMode } from '../../../store/slices/notificationsSlice';
import NotificationsCardView from './components/NotificationsCardView';
import NotificationsCardEdit from './components/NotificationsCardEdit';
import { NotificationsCardMode } from './types/NotificationsCard.types';

interface NotificationsCardProps {
  showActions?: boolean;
  /**
   * Overtime alerts block — same gate as Overtime policy card (QB_OVERTIME_SETTINGS_UI).
   * Passed from UserSettingsPage (one IXP read shared with overtime data hooks).
   */
  showOvertimeNotificationsSection?: boolean;
  overtimeBadgeVisibilityEndDate?: string;
  showScheduleNotificationsSection?: boolean;
}

/**
 * NotificationsCard component
 *
 * Data is fetched and synced to Redux by useNotificationsCardData hook in UserSettingsPage.
 * This component reads directly from Redux store.
 */
const NotificationsCard: React.FC<NotificationsCardProps> = ({
  showActions = true,
  showOvertimeNotificationsSection = false,
  overtimeBadgeVisibilityEndDate = '',
  showScheduleNotificationsSection = false,
}) => {
  const sandbox = useSandbox();
  const mode = useAppSelector(selectNotificationsMode);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    sandbox.logger.info(
      'Component=NotificationsCard Event=Notifications user settings viewed',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset success toast when mode changes to edit
  useEffect(() => {
    if (mode === NotificationsCardMode.EDIT) {
      setShowSuccessToast(false);
    }
  }, [mode]);

  const handleSaveSuccess = () => {
    setShowSuccessToast(true);
  };

  const handleCloseSuccessToast = () => {
    setShowSuccessToast(false);
  };

  if (mode === NotificationsCardMode.VIEW) {
    return (
      <NotificationsCardView
        showActions={showActions}
        showSuccessToast={showSuccessToast}
        onCloseSuccessToast={handleCloseSuccessToast}
        showOvertimeNotificationsSection={showOvertimeNotificationsSection}
        overtimeBadgeVisibilityEndDate={overtimeBadgeVisibilityEndDate}
        showScheduleNotificationsSection={showScheduleNotificationsSection}
      />
    );
  }

  return (
    <NotificationsCardEdit
      onSaveSuccess={handleSaveSuccess}
      showOvertimeNotificationsSection={showOvertimeNotificationsSection}
      showScheduleNotificationsSection={showScheduleNotificationsSection}
    />
  );
};

export default NotificationsCard;
