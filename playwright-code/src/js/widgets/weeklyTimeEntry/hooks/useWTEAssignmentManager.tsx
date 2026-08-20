import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useStore } from 'react-redux';
import { useSandbox } from '@payroll/quicksand';
import { useCustomFieldAssignments } from 'src/js/service/hooks/assignments/useCustomFieldAssignments';
import { useStandardFieldAssignments } from 'src/js/service/hooks/assignments/useStandardFieldAssignments';
import { useCustomFieldOptionAssignments } from 'src/js/service/hooks/assignments/useCustomFieldOptionAssignments';
import type { RootState } from '../store';
import { useAppSelector, useAppDispatch } from '../store';
import {
  selectTimesheetRows,
  selectTeamMember,
  selectCompanySettings,
} from '../store/selectors';
import {
  setWorker,
  setCustomerLoading,
  setCustomerSF,
  setCustomerCF,
  setCustomerError,
  setCustomerCFOLoading,
  setCustomFieldOptionAssignments,
} from '../store/assignmentSlice';
import { enrichCFOOptionsWithNamesFromCF } from '../utils/helpers';

export const WTEAssignmentManager: React.FC = () => {
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const rows = useAppSelector(selectTimesheetRows);
  const teamMember = useAppSelector(selectTeamMember);
  const companySettings = useAppSelector(selectCompanySettings);
  const allCustomFields = useAppSelector(
    (state) => state.customFields?.customFields || [],
  );

  const workerId = teamMember?.id || null;
  const isOTX = true;

  const timeAgainstEntities = useMemo(() => {
    const byId = new Map<string, 'CUSTOMER' | 'PROJECT'>();
    rows.forEach((row) => {
      const type = row.timeAgainst?.type;
      const id = row.timeAgainst?.id;
      if (id && (type === 'CUSTOMER' || type === 'PROJECT')) {
        if (!byId.has(id)) byId.set(id, type as 'CUSTOMER' | 'PROJECT');
      }
    });
    return Array.from(byId.entries()).map(([id, type]) => ({ id, type }));
  }, [rows]);

  const cachedCustomersRef = useRef<Record<string, boolean>>({});
  const cachedCustomersKeyRef = useRef<string>('');
  const cachedCustomers = useAppSelector((state) => {
    const cached: Record<string, boolean> = {};
    timeAgainstEntities.forEach(({ id }) => {
      if (id && id !== '') {
        const data = state.assignments.customerAssignments[id];
        cached[id] = !!(data && data.lastFetched > 0);
      }
    });
    const key = timeAgainstEntities
      .map(({ id }) => `${id}:${cached[id] ?? false}`)
      .sort()
      .join('|');
    if (key === cachedCustomersKeyRef.current)
      return cachedCustomersRef.current;
    cachedCustomersKeyRef.current = key;
    cachedCustomersRef.current = cached;
    return cached;
  });

  const currentWorkerId = useAppSelector(
    (state) => state.assignments.currentWorkerId,
  );

  const { loadCustomFieldAssignments, error: customFieldError } =
    useCustomFieldAssignments();
  const { loadStandardFieldAssignments, error: standardFieldError } =
    useStandardFieldAssignments();
  const {
    loadCustomFieldOptionAssignments,
    data: customFieldOptionData,
    loading: customFieldOptionLoading,
  } = useCustomFieldOptionAssignments();

  // Only refs we need: current entity (block next fetch until SFO/CFO done), and CFO chain state
  const currentFetchEntityRef = useRef<{
    id: string;
    type: 'CUSTOMER' | 'PROJECT';
  } | null>(null);
  const currentFetchCFIdRef = useRef<string | null>(null);
  const currentFetchDropdownCFIdListRef = useRef<string[]>([]);
  const pendingSFRef = useRef(false);
  const pendingCFRef = useRef(false);

  useEffect(() => {
    if (workerId !== currentWorkerId) dispatch(setWorker(workerId));
  }, [workerId, currentWorkerId, dispatch]);

  const nextEntityToFetch = useMemo(() => {
    if (!isOTX || !workerId || timeAgainstEntities.length === 0) return null;
    const uncached = timeAgainstEntities.find(
      ({ id }) => id && id !== '' && !cachedCustomers[id],
    );
    return uncached ?? null;
  }, [isOTX, workerId, timeAgainstEntities, cachedCustomers]);

  // Run SFO/CFO after both SF and CF are in Redux (called from onSuccess callbacks)
  const runSfoCfoForEntity = useCallback(
    (entityId: string) => {
      const state = store.getState();
      const entry = state.assignments.customerAssignments[entityId];
      if (!entry || !workerId) {
        if (!workerId) currentFetchEntityRef.current = null;
        return;
      }
      const sfAssignments = entry.standardFieldAssignments ?? [];
      const cfAssignments = entry.customFieldAssignments ?? [];

      const rowsForEntity = rows.filter((r) => r.timeAgainst?.id === entityId);
      const isDropdownType = (cf: { id: string }) => {
        const acf = allCustomFields?.find((f: any) => f.id === cf.id);
        const t = acf?.type?.toUpperCase();
        const hasOptions =
          acf?.options && Array.isArray(acf.options) && acf.options.length > 0;
        return t === 'DROPDOWN' || t === 'MULTI_SELECT' || !!hasOptions;
      };
      const assignedDropdownCFs = (
        cfAssignments as Array<{ id: string; assigned?: boolean }>
      )
        .filter((cf) => isDropdownType(cf) && cf.assigned)
        .map((cf) => cf.id);
      const cfIdsWithValueOnEntity = new Set<string>();
      rowsForEntity.forEach((r) => {
        Object.values(r.timeEntries || {}).forEach((e: any) => {
          (e.customFields || []).forEach((cf: any) => {
            if (
              cf.id &&
              ((cf.value != null && cf.value !== '') ||
                (cf.optionID != null && cf.optionID !== ''))
            )
              cfIdsWithValueOnEntity.add(cf.id);
          });
        });
      });
      const dropdownCFIdsFromAssignments = new Set(assignedDropdownCFs);
      cfIdsWithValueOnEntity.forEach((id) => {
        const acf = allCustomFields?.find((f: any) => f.id === id);
        if (acf && isDropdownType({ id: acf.id }))
          dropdownCFIdsFromAssignments.add(id);
      });
      const dropdownCFs = Array.from(dropdownCFIdsFromAssignments).map(
        (id) => ({
          id,
          assigned: cfAssignments.some((c: any) => c.id === id && c.assigned),
        }),
      );

      if (dropdownCFs.length > 0 && allCustomFields?.length > 0) {
        const dropdownCFIdList = dropdownCFs.map((cf) => cf.id);
        currentFetchDropdownCFIdListRef.current = dropdownCFIdList;
        currentFetchCFIdRef.current = dropdownCFs[0].id;
        dispatch(
          setCustomerCFOLoading({ customerId: entityId, loading: true }),
        );
        loadCustomFieldOptionAssignments({
          input: {
            timeForEntityId: workerId,
            timeAgainstEntityId: entityId,
            customFieldIds: dropdownCFs[0].id,
          },
          filter: { assigned: true, active: true },
          first: 100,
        });
        return;
      }

      currentFetchEntityRef.current = null;
    },
    [
      store,
      workerId,
      rows,
      allCustomFields,
      dispatch,
      loadCustomFieldOptionAssignments,
    ],
  );

  // Fetch next uncached entity; store SF/CF in Redux from API onSuccess so we always have correct data
  useEffect(() => {
    if (!nextEntityToFetch) return;
    const { id, type } = nextEntityToFetch;
    if (currentFetchEntityRef.current?.id === id) return;

    currentFetchEntityRef.current = { id, type };
    currentFetchCFIdRef.current = null;
    currentFetchDropdownCFIdListRef.current = [];
    const requestedCF = !!(allCustomFields && allCustomFields.length > 0);
    pendingSFRef.current = true;
    pendingCFRef.current = requestedCF;

    const input = { customerId: id };
    const filter = { assigned: true };
    dispatch(setCustomerLoading({ customerId: id, loading: true }));

    const maybeRunSfoCfo = () => {
      if (!pendingSFRef.current && !pendingCFRef.current)
        runSfoCfoForEntity(id);
    };

    loadStandardFieldAssignments({
      input,
      filter,
      first: 100,
      onSuccess: (data) => {
        dispatch(
          setCustomerSF({ customerId: id, standardFieldAssignments: data }),
        );
        pendingSFRef.current = false;
        maybeRunSfoCfo();
      },
    });

    if (requestedCF) {
      loadCustomFieldAssignments({
        input,
        filter,
        first: 100,
        onSuccess: (data) => {
          dispatch(
            setCustomerCF({ customerId: id, customFieldAssignments: data }),
          );
          pendingCFRef.current = false;
          maybeRunSfoCfo();
        },
      });
    } else {
      pendingCFRef.current = false;
    }
  }, [
    nextEntityToFetch,
    loadStandardFieldAssignments,
    loadCustomFieldAssignments,
    dispatch,
    allCustomFields,
    runSfoCfoForEntity,
  ]);

  useEffect(() => {
    const entityId = currentFetchEntityRef.current?.id;
    if (!entityId || !currentFetchCFIdRef.current) return;
    if (customFieldOptionLoading) return;
    if (!Array.isArray(customFieldOptionData)) return;

    const cfId = currentFetchCFIdRef.current;
    const optionsWithNames = enrichCFOOptionsWithNamesFromCF(
      customFieldOptionData,
      cfId,
      allCustomFields,
      sandbox,
    );
    dispatch(
      setCustomFieldOptionAssignments({
        customerId: entityId,
        customFieldId: cfId,
        options: optionsWithNames,
      }),
    );

    const dropdownCFIdList = currentFetchDropdownCFIdListRef.current;
    const currentIndex = dropdownCFIdList.indexOf(cfId);
    const nextId = dropdownCFIdList[currentIndex + 1];

    if (nextId) {
      currentFetchCFIdRef.current = nextId;
      loadCustomFieldOptionAssignments({
        input: {
          timeForEntityId: workerId || null,
          timeAgainstEntityId: entityId,
          customFieldIds: nextId,
        },
        filter: { assigned: true, active: true },
        first: 100,
      });
    } else {
      currentFetchEntityRef.current = null;
      currentFetchCFIdRef.current = null;
      currentFetchDropdownCFIdListRef.current = [];
    }
  }, [
    customFieldOptionData,
    customFieldOptionLoading,
    dispatch,
    allCustomFields,
    workerId,
    loadCustomFieldOptionAssignments,
  ]);

  useEffect(() => {
    const entityId = currentFetchEntityRef.current?.id;
    if ((customFieldError || standardFieldError) && entityId) {
      dispatch(
        setCustomerError({
          customerId: entityId,
          error:
            customFieldError ||
            standardFieldError ||
            'Failed to fetch assignments',
        }),
      );
      currentFetchEntityRef.current = null;
    }
  }, [customFieldError, standardFieldError, dispatch]);

  return null;
};
