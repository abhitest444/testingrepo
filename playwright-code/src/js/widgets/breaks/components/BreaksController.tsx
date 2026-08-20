import React, { useEffect } from 'react';
import { useTeamMembers } from 'src/js/widgets/breaks/hooks/useTeamMembers';

import useBreaksCrud from 'src/js/widgets/breaks/hooks/useBreaksCrud';
import {
  selectBreakRules,
  selectBreakRulesRefetch,
  setRefetchBreakPolicies,
} from 'src/js/widgets/breaks/store/breakRulesSlice';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/breaks/store/hooks';
import { MAX_BREAK_RULES } from 'src/js/widgets/breaks/constants';
import { setIsAddBreakRuleEnabled } from 'src/js/widgets/breaks/store/uiSlice';

const BreaksController = ({ children }: { children: React.ReactNode }) => {
  useTeamMembers();
  const { getAllBreaksPolicies } = useBreaksCrud();
  const breakRules = useAppSelector(selectBreakRules);
  const dispatch = useAppDispatch();

  const breakRulesRefetch = useAppSelector(selectBreakRulesRefetch);

  useEffect(() => {
    getAllBreaksPolicies();
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    if (breakRules.length > 0) {
      dispatch(setIsAddBreakRuleEnabled(breakRules.length < MAX_BREAK_RULES));
    }
  }, [breakRules.length]);

  useEffect(() => {
    if (breakRulesRefetch) {
      getAllBreaksPolicies();
      dispatch(setRefetchBreakPolicies(false));
    }
  }, [breakRulesRefetch]);
  return <>{children}</>;
};

export default BreaksController;
