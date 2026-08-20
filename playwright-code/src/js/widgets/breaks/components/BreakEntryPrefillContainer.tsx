import React, { useEffect } from 'react';
import { useGetTimeEntry } from 'src/js/service/hooks/timeEntries/useGetTimeEntry';
import { useAppDispatch } from '../store/hooks';
import { openBreakEntryEditForm } from '../store/breakEntriesSlice';
import { mapTimeEntryToBreakEntry } from '../utils/mapTimeEntryToBreakEntry';

interface PrefillContainerProps {
  children: React.ReactNode;
  timeEntryId?: string;
}

const BreakEntryPrefillContainer: React.FC<PrefillContainerProps> = ({
  children,
  timeEntryId,
}) => {
  const dispatch = useAppDispatch();

  // Fetch time entry data if timeEntryId is provided
  const { data: timeEntry, loading } = useGetTimeEntry({
    id: timeEntryId,
    isExported: false, // We want time entries, not time activities
  });

  useEffect(() => {
    if (timeEntry && timeEntryId) {
      // Map the time entry to break entry format
      const breakEntryData = mapTimeEntryToBreakEntry(timeEntry);
      // Open the form with the mapped data
      dispatch(openBreakEntryEditForm(breakEntryData));
    }
  }, [timeEntry, timeEntryId, dispatch]);

  // Show loading state while fetching data
  if (loading && timeEntryId) {
    return null;
  }

  return <>{children}</>;
};

export default BreakEntryPrefillContainer;
