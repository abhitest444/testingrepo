import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { clearAllBreaksByAssignee } from '../store/quickfillsSlice';

export default function useQuickfillsCrud() {
  const dispatch = useAppDispatch();

  const clearQuickfillData = useCallback(() => {
    dispatch(clearAllBreaksByAssignee());
  }, [dispatch]);

  return {
    clearQuickfillData,
  };
}
