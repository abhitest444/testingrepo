import geofenceConfigurationReducer, {
  setGeofenceConfigurationLoading,
  setGeofenceConfigurationNodes,
  setGeofenceConfigurationError,
  setGeofenceOverride,
  upsertGeofenceNode,
  selectGeofenceConfigurationNodes,
  selectGeofenceConfigurationLoading,
  selectGeofenceConfigurationError,
  selectGeofenceOverrides,
  selectGeofenceOverrideForEntityId,
  selectGeofenceNodeForEntity,
} from 'src/js/widgets/assignments/store/geofenceConfigurationSlice';
import type { GeofenceConfigurationNode } from 'src/js/service/hooks/assignments/useGeofenceConfiguration';

describe('geofenceConfigurationSlice', () => {
  const initialState = {
    nodes: [],
    loading: false,
    error: null,
    overrides: {},
  };

  const mockNodes: GeofenceConfigurationNode[] = [
    {
      timeAgainstContactDAS: { customer: { id: 'cust-1' } },
      geofenceEnabled: { value: true, meta: { version: 'v1' } },
      geofenceLocation: {
        latitude: 37.7749,
        longitude: -122.4194,
        geofenceRadiusInMeter: 200,
      },
    },
    {
      timeAgainstContactDAS: {
        customer: { id: 'cust-2' },
        project: { id: 'proj-1' },
      },
      geofenceEnabled: { value: false },
    },
  ];

  it('should return the initial state', () => {
    expect(
      geofenceConfigurationReducer(undefined, { type: 'unknown' }),
    ).toEqual(initialState);
  });

  // ─── reducers ─────────────────────────────────────────────────────────────────

  describe('setGeofenceConfigurationLoading', () => {
    it('should set loading to true', () => {
      const state = geofenceConfigurationReducer(
        initialState,
        setGeofenceConfigurationLoading(true),
      );
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const loadingState = { ...initialState, loading: true };
      const state = geofenceConfigurationReducer(
        loadingState,
        setGeofenceConfigurationLoading(false),
      );
      expect(state.loading).toBe(false);
    });
  });

  describe('setGeofenceConfigurationNodes', () => {
    it('should set nodes', () => {
      const state = geofenceConfigurationReducer(
        initialState,
        setGeofenceConfigurationNodes(mockNodes),
      );
      expect(state.nodes).toEqual(mockNodes);
    });

    it('should replace existing nodes', () => {
      const stateWithNodes = { ...initialState, nodes: mockNodes };
      const newNodes: GeofenceConfigurationNode[] = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-99' } },
          geofenceEnabled: { value: true },
        },
      ];
      const state = geofenceConfigurationReducer(
        stateWithNodes,
        setGeofenceConfigurationNodes(newNodes),
      );
      expect(state.nodes).toEqual(newNodes);
      expect(state.nodes).toHaveLength(1);
    });

    it('should allow setting an empty array', () => {
      const stateWithNodes = { ...initialState, nodes: mockNodes };
      const state = geofenceConfigurationReducer(
        stateWithNodes,
        setGeofenceConfigurationNodes([]),
      );
      expect(state.nodes).toEqual([]);
    });

    it('should clear stale overrides for entities present in the incoming payload', () => {
      // Simulates: user toggled cust-1 OFF (override=false), then API returns fresh
      // data saying cust-1 is ON — the override must not shadow the API truth.
      const stateWithOverrides = {
        ...initialState,
        overrides: { 'cust-1': false, 'cust-2': false },
      };
      const state = geofenceConfigurationReducer(
        stateWithOverrides,
        setGeofenceConfigurationNodes(mockNodes), // mockNodes has cust-1 and proj-1/cust-2
      );
      expect(state.overrides['cust-1']).toBeUndefined();
      expect(state.overrides['proj-1']).toBeUndefined();
    });

    it('should prefer project id over customer id when deriving entity key', () => {
      const stateWithOverride = {
        ...initialState,
        overrides: { 'proj-1': false },
      };
      const nodeWithProject: GeofenceConfigurationNode = {
        timeAgainstContactDAS: {
          customer: { id: 'cust-2' },
          project: { id: 'proj-1' },
        },
        geofenceEnabled: { value: true },
      };
      const state = geofenceConfigurationReducer(
        stateWithOverride,
        setGeofenceConfigurationNodes([nodeWithProject]),
      );
      expect(state.overrides['proj-1']).toBeUndefined();
    });

    it('should not clear overrides for entities absent from the incoming payload', () => {
      const stateWithOverrides = {
        ...initialState,
        overrides: { 'cust-unrelated': true },
      };
      const state = geofenceConfigurationReducer(
        stateWithOverrides,
        setGeofenceConfigurationNodes(mockNodes),
      );
      // cust-unrelated is not in mockNodes — its override should be untouched
      expect(state.overrides['cust-unrelated']).toBe(true);
    });
  });

  describe('setGeofenceConfigurationError', () => {
    it('should set error message', () => {
      const state = geofenceConfigurationReducer(
        initialState,
        setGeofenceConfigurationError('Something went wrong'),
      );
      expect(state.error).toBe('Something went wrong');
    });

    it('should clear error when set to null', () => {
      const stateWithError = { ...initialState, error: 'old error' };
      const state = geofenceConfigurationReducer(
        stateWithError,
        setGeofenceConfigurationError(null),
      );
      expect(state.error).toBeNull();
    });
  });

  describe('setGeofenceOverride', () => {
    it('should set an override for a given entity id', () => {
      const state = geofenceConfigurationReducer(
        initialState,
        setGeofenceOverride({ entityId: 'cust-1', value: true }),
      );
      expect(state.overrides).toEqual({ 'cust-1': true });
    });

    it('should update an existing override', () => {
      const stateWithOverride = {
        ...initialState,
        overrides: { 'cust-1': true },
      };
      const state = geofenceConfigurationReducer(
        stateWithOverride,
        setGeofenceOverride({ entityId: 'cust-1', value: false }),
      );
      expect(state.overrides['cust-1']).toBe(false);
    });

    it('should preserve other overrides when adding a new one', () => {
      const stateWithOverride = {
        ...initialState,
        overrides: { 'cust-1': true },
      };
      const state = geofenceConfigurationReducer(
        stateWithOverride,
        setGeofenceOverride({ entityId: 'proj-1', value: false }),
      );
      expect(state.overrides).toEqual({ 'cust-1': true, 'proj-1': false });
    });
  });

  describe('upsertGeofenceNode', () => {
    it('should add a new node when no matching entity exists', () => {
      const newNode: GeofenceConfigurationNode = {
        timeAgainstContactDAS: { customer: { id: 'cust-new' } },
        geofenceEnabled: { value: true },
      };
      const state = geofenceConfigurationReducer(
        initialState,
        upsertGeofenceNode(newNode),
      );
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0]).toEqual(newNode);
    });

    it('should update an existing node matched by customer id', () => {
      const stateWithNodes = { ...initialState, nodes: [...mockNodes] };
      const updatedNode: GeofenceConfigurationNode = {
        timeAgainstContactDAS: { customer: { id: 'cust-1' } },
        geofenceEnabled: { value: false },
        geofenceLocation: {
          latitude: 40.7128,
          longitude: -74.006,
          geofenceRadiusInMeter: 500,
        },
      };
      const state = geofenceConfigurationReducer(
        stateWithNodes,
        upsertGeofenceNode(updatedNode),
      );
      expect(state.nodes).toHaveLength(2);
      expect(state.nodes[0]).toEqual(updatedNode);
    });

    it('should update an existing node matched by customer and project id', () => {
      const stateWithNodes = { ...initialState, nodes: [...mockNodes] };
      const updatedNode: GeofenceConfigurationNode = {
        timeAgainstContactDAS: {
          customer: { id: 'cust-2' },
          project: { id: 'proj-1' },
        },
        geofenceEnabled: { value: true },
      };
      const state = geofenceConfigurationReducer(
        stateWithNodes,
        upsertGeofenceNode(updatedNode),
      );
      expect(state.nodes).toHaveLength(2);
      expect(state.nodes[1]).toEqual(updatedNode);
    });

    it('should match on both customer.id and project.id', () => {
      const existingNode: GeofenceConfigurationNode = {
        timeAgainstContactDAS: {
          customer: { id: 'cust-x' },
          project: { id: 'proj-x' },
        },
        geofenceEnabled: { value: false },
      };
      const stateWithNodes = { ...initialState, nodes: [existingNode] };
      const updatedNode: GeofenceConfigurationNode = {
        timeAgainstContactDAS: {
          customer: { id: 'cust-x' },
          project: { id: 'proj-x' },
        },
        geofenceEnabled: { value: true },
      };
      const state = geofenceConfigurationReducer(
        stateWithNodes,
        upsertGeofenceNode(updatedNode),
      );
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0]).toEqual(updatedNode);
    });

    it('should clear the override for the upserted entity (inline toggle success path)', () => {
      // Simulates: optimistic override set to false, mutation succeeds, upsertGeofenceNode
      // fires — override must be removed so the node data is the source of truth.
      const stateWithOverride = {
        ...initialState,
        nodes: [...mockNodes],
        overrides: { 'cust-1': false },
      };
      const updatedNode: GeofenceConfigurationNode = {
        timeAgainstContactDAS: { customer: { id: 'cust-1' } },
        geofenceEnabled: { value: false, meta: { version: 'v2' } },
      };
      const state = geofenceConfigurationReducer(
        stateWithOverride,
        upsertGeofenceNode(updatedNode),
      );
      expect(state.overrides['cust-1']).toBeUndefined();
    });

    it('should clear the customer-level override on upsert even when project exists', () => {
      const stateWithOverride = {
        ...initialState,
        nodes: [...mockNodes],
        overrides: { 'cust-2': true },
      };
      const updatedNode: GeofenceConfigurationNode = {
        timeAgainstContactDAS: {
          customer: { id: 'cust-2' },
          project: { id: 'proj-1' },
        },
        geofenceEnabled: { value: true },
      };
      const state = geofenceConfigurationReducer(
        stateWithOverride,
        upsertGeofenceNode(updatedNode),
      );
      expect(state.overrides['cust-2']).toBeUndefined();
    });

    it('should not affect overrides for other entities on upsert', () => {
      const stateWithOverrides = {
        ...initialState,
        nodes: [...mockNodes],
        overrides: { 'cust-1': false, 'cust-other': true },
      };
      const updatedNode: GeofenceConfigurationNode = {
        timeAgainstContactDAS: { customer: { id: 'cust-1' } },
        geofenceEnabled: { value: false },
      };
      const state = geofenceConfigurationReducer(
        stateWithOverrides,
        upsertGeofenceNode(updatedNode),
      );
      expect(state.overrides['cust-other']).toBe(true);
    });

    it('should not match when customer.id differs even if project.id matches', () => {
      const existingNode: GeofenceConfigurationNode = {
        timeAgainstContactDAS: {
          customer: { id: 'cust-a' },
          project: { id: 'proj-x' },
        },
        geofenceEnabled: { value: false },
      };
      const stateWithNodes = { ...initialState, nodes: [existingNode] };
      const incomingNode: GeofenceConfigurationNode = {
        timeAgainstContactDAS: {
          customer: { id: 'cust-b' },
          project: { id: 'proj-x' },
        },
        geofenceEnabled: { value: true },
      };
      const state = geofenceConfigurationReducer(
        stateWithNodes,
        upsertGeofenceNode(incomingNode),
      );
      expect(state.nodes).toHaveLength(2);
    });
  });

  // ─── selectors ──────────────────────────────────────────────────────────────

  describe('selectors', () => {
    const mockRootState = {
      geofenceConfiguration: {
        nodes: mockNodes,
        loading: true,
        error: 'some error',
        overrides: { 'cust-1': true, 'proj-1': false },
      },
    };

    it('selectGeofenceConfigurationNodes should return nodes', () => {
      expect(selectGeofenceConfigurationNodes(mockRootState as any)).toEqual(
        mockNodes,
      );
    });

    it('selectGeofenceConfigurationLoading should return loading', () => {
      expect(selectGeofenceConfigurationLoading(mockRootState as any)).toBe(
        true,
      );
    });

    it('selectGeofenceConfigurationError should return error', () => {
      expect(selectGeofenceConfigurationError(mockRootState as any)).toBe(
        'some error',
      );
    });

    it('selectGeofenceOverrides should return overrides map', () => {
      expect(selectGeofenceOverrides(mockRootState as any)).toEqual({
        'cust-1': true,
        'proj-1': false,
      });
    });

    describe('selectGeofenceOverrideForEntityId', () => {
      it('should return the override value for an existing entity id', () => {
        const selector = selectGeofenceOverrideForEntityId('cust-1');
        expect(selector(mockRootState as any)).toBe(true);
      });

      it('should return false override for an entity with false value', () => {
        const selector = selectGeofenceOverrideForEntityId('proj-1');
        expect(selector(mockRootState as any)).toBe(false);
      });

      it('should return undefined for a non-existent entity id', () => {
        const selector = selectGeofenceOverrideForEntityId('unknown-id');
        expect(selector(mockRootState as any)).toBeUndefined();
      });
    });

    describe('selectGeofenceNodeForEntity', () => {
      it('should find node by customer id when no project', () => {
        const selector = selectGeofenceNodeForEntity('cust-1');
        expect(selector(mockRootState as any)).toEqual(mockNodes[0]);
      });

      it('should find node by customer id and project id', () => {
        const selector = selectGeofenceNodeForEntity('cust-2', 'proj-1');
        expect(selector(mockRootState as any)).toEqual(mockNodes[1]);
      });

      it('should return undefined when customer id not found', () => {
        const selector = selectGeofenceNodeForEntity('unknown-id');
        expect(selector(mockRootState as any)).toBeUndefined();
      });

      it('should not match a project-level node when searching by customer id only', () => {
        const selector = selectGeofenceNodeForEntity('cust-2');
        expect(selector(mockRootState as any)).toBeUndefined();
      });

      it('should match on both customer.id and project.id', () => {
        const stateWithBothIds = {
          geofenceConfiguration: {
            ...mockRootState.geofenceConfiguration,
            nodes: [
              {
                timeAgainstContactDAS: {
                  customer: { id: 'cust-x' },
                  project: { id: 'proj-x' },
                },
                geofenceEnabled: { value: true },
              },
            ],
          },
        };
        const selector = selectGeofenceNodeForEntity('cust-x', 'proj-x');
        expect(selector(stateWithBothIds as any)).toBeDefined();
      });

      it('should not match when customer.id matches but project.id differs', () => {
        const stateWithBothIds = {
          geofenceConfiguration: {
            ...mockRootState.geofenceConfiguration,
            nodes: [
              {
                timeAgainstContactDAS: {
                  customer: { id: 'cust-x' },
                  project: { id: 'proj-x' },
                },
                geofenceEnabled: { value: true },
              },
            ],
          },
        };
        const selector = selectGeofenceNodeForEntity('cust-x', 'proj-other');
        expect(selector(stateWithBothIds as any)).toBeUndefined();
      });
    });
  });
});
