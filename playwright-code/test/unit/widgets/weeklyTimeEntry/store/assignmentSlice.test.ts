import assignmentReducer, {
  setWorker,
  setCustomerSF,
  setCustomerCF,
  setGlobalSFO,
  clearAllAssignments,
} from '../../../../../src/js/widgets/weeklyTimeEntry/store/assignmentSlice';

describe('assignmentSlice', () => {
  const initialState = {
    globalOptions: {
      standardFieldOptions: { service: [], class: [], location: [] },
      customFieldOptions: {},
      workerOnlyCFAssignments: [],
      loading: false,
      error: null,
    },
    customerAssignments: {} as Record<string, any>,
    currentWorkerId: null as string | null,
  };

  describe('setWorker', () => {
    it('should set currentWorkerId and clear customerAssignments and globalOptions', () => {
      const stateWithData = assignmentReducer(
        initialState as any,
        setCustomerSF({
          customerId: 'cust1',
          standardFieldAssignments: [{ name: 'CLASS', assigned: true }],
        }),
      );
      const stateWithGlobal = assignmentReducer(
        stateWithData as any,
        setGlobalSFO({
          fieldType: 'class',
          options: [{ id: 'opt1', name: 'Class A', assigned: true }],
        }),
      );

      expect(stateWithGlobal.customerAssignments.cust1).toBeDefined();
      expect(
        stateWithGlobal.globalOptions.standardFieldOptions.class,
      ).toHaveLength(1);

      const state = assignmentReducer(
        stateWithGlobal as any,
        setWorker('worker1'),
      );

      expect(state.currentWorkerId).toBe('worker1');
      expect(state.customerAssignments).toEqual({});
      expect(state.globalOptions.standardFieldOptions).toEqual({
        service: [],
        class: [],
        location: [],
      });
      expect(state.globalOptions.customFieldOptions).toEqual({});
    });

    it('should allow setting worker to null', () => {
      const state = assignmentReducer(
        { ...initialState, currentWorkerId: 'worker1' } as any,
        setWorker(null),
      );
      expect(state.currentWorkerId).toBeNull();
      expect(state.customerAssignments).toEqual({});
    });
  });

  describe('extraReducers: timeEntryGrid/setDateRange', () => {
    it('should reset customerAssignments and globalOptions when date range changes', () => {
      const stateWithData = assignmentReducer(
        initialState as any,
        setCustomerSF({
          customerId: 'cust1',
          standardFieldAssignments: [{ name: 'CLASS', assigned: true }],
        }),
      );
      const stateWithGlobal = assignmentReducer(
        stateWithData as any,
        setGlobalSFO({
          fieldType: 'service',
          options: [{ id: 's1', name: 'Service 1', assigned: true }],
        }),
      );

      expect(Object.keys(stateWithGlobal.customerAssignments)).toContain(
        'cust1',
      );
      expect(
        stateWithGlobal.globalOptions.standardFieldOptions.service,
      ).toHaveLength(1);

      const state = assignmentReducer(stateWithGlobal as any, {
        type: 'timeEntryGrid/setDateRange',
        payload: { start: '2025-01-06', end: '2025-01-12' },
      });

      expect(state.customerAssignments).toEqual({});
      expect(state.globalOptions.standardFieldOptions).toEqual({
        service: [],
        class: [],
        location: [],
      });
      expect(state.globalOptions.customFieldOptions).toEqual({});
      expect(state.currentWorkerId).toBe(stateWithGlobal.currentWorkerId);
    });
  });

  describe('clearAllAssignments', () => {
    it('should clear customerAssignments and reset globalOptions', () => {
      const stateWithData = assignmentReducer(
        initialState as any,
        setCustomerCF({
          customerId: 'cust1',
          customFieldAssignments: [{ id: 'cf1', assigned: true }],
        }),
      );

      expect(stateWithData.customerAssignments.cust1).toBeDefined();

      const state = assignmentReducer(
        stateWithData as any,
        clearAllAssignments(),
      );

      expect(state.customerAssignments).toEqual({});
      expect(state.globalOptions.standardFieldOptions).toEqual({
        service: [],
        class: [],
        location: [],
      });
    });
  });
});
