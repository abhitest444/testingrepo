import permissionsReducer, {
  setPermissions,
  setPermissionsLoading,
  resetPermissions,
} from 'src/js/widgets/qbtOrchestrator/store/shared/permissionsSlice';

describe('permissionsSlice', () => {
  const initialState = {
    permissions: {},
    isLoading: false,
  };

  const mockPermissions: Record<string, boolean> = {
    'overtime.view': true,
    'overtime.create': true,
    'overtime.edit': true,
    'overtime.delete': false,
    'breaks.view': true,
    'breaks.manage': false,
    'admin.access': false,
  };

  describe('reducers', () => {
    describe('setPermissions', () => {
      it('should set permissions', () => {
        const state = permissionsReducer(
          initialState,
          setPermissions(mockPermissions),
        );

        expect(state.permissions).toEqual(mockPermissions);
      });

      it('should clear loading when setting permissions', () => {
        const loadingState = { ...initialState, isLoading: true };
        const state = permissionsReducer(
          loadingState,
          setPermissions(mockPermissions),
        );

        expect(state.isLoading).toBe(false);
      });

      it('should replace existing permissions', () => {
        const stateWithPermissions = {
          ...initialState,
          permissions: { 'old.permission': true },
        };
        const newPermissions = { 'new.permission': false };

        const state = permissionsReducer(
          stateWithPermissions,
          setPermissions(newPermissions),
        );

        expect(state.permissions).toEqual(newPermissions);
        expect(state.permissions).not.toHaveProperty('old.permission');
      });

      it('should handle empty permissions object', () => {
        const stateWithPermissions = {
          ...initialState,
          permissions: mockPermissions,
        };

        const state = permissionsReducer(
          stateWithPermissions,
          setPermissions({}),
        );

        expect(state.permissions).toEqual({});
      });
    });

    describe('setPermissionsLoading', () => {
      it('should set loading to true', () => {
        const state = permissionsReducer(
          initialState,
          setPermissionsLoading(true),
        );

        expect(state.isLoading).toBe(true);
      });

      it('should set loading to false', () => {
        const loadingState = { ...initialState, isLoading: true };
        const state = permissionsReducer(
          loadingState,
          setPermissionsLoading(false),
        );

        expect(state.isLoading).toBe(false);
      });

      it('should preserve permissions when setting loading', () => {
        const stateWithPermissions = {
          ...initialState,
          permissions: mockPermissions,
        };

        const state = permissionsReducer(
          stateWithPermissions,
          setPermissionsLoading(true),
        );

        expect(state.permissions).toEqual(mockPermissions);
      });
    });

    describe('resetPermissions', () => {
      it('should reset to initial state', () => {
        const modifiedState = {
          permissions: mockPermissions,
          isLoading: true,
        };

        const state = permissionsReducer(modifiedState, resetPermissions());

        expect(state).toEqual(initialState);
      });
    });
  });

  describe('permission checking scenarios', () => {
    it('should support granular permissions', () => {
      const granularPermissions = {
        'feature.overtime.policy.view': true,
        'feature.overtime.policy.create': true,
        'feature.overtime.policy.edit': true,
        'feature.overtime.policy.delete': false,
        'feature.overtime.rules.view': true,
        'feature.overtime.rules.manage': false,
      };

      const state = permissionsReducer(
        initialState,
        setPermissions(granularPermissions),
      );

      expect(state.permissions['feature.overtime.policy.view']).toBe(true);
      expect(state.permissions['feature.overtime.policy.delete']).toBe(false);
      expect(state.permissions['feature.overtime.rules.manage']).toBe(false);
    });

    it('should handle feature flag style permissions', () => {
      const featureFlags = {
        isOvertimeEnabled: true,
        isBreaksEnabled: true,
        isSchedulingEnabled: false,
        isBetaUser: true,
      };

      const state = permissionsReducer(
        initialState,
        setPermissions(featureFlags),
      );

      expect(state.permissions.isOvertimeEnabled).toBe(true);
      expect(state.permissions.isSchedulingEnabled).toBe(false);
    });

    it('should handle role-based permissions', () => {
      const adminPermissions = {
        'role.admin': true,
        'role.manager': true,
        'role.employee': true,
        canManageUsers: true,
        canViewReports: true,
        canModifySettings: true,
      };

      const state = permissionsReducer(
        initialState,
        setPermissions(adminPermissions),
      );

      Object.values(state.permissions).forEach((value) => {
        expect(value).toBe(true);
      });
    });

    it('should handle limited user permissions', () => {
      const limitedPermissions = {
        'role.admin': false,
        'role.manager': false,
        'role.employee': true,
        canManageUsers: false,
        canViewReports: false,
        canModifySettings: false,
        canViewOwnTime: true,
        canEditOwnTime: true,
      };

      const state = permissionsReducer(
        initialState,
        setPermissions(limitedPermissions),
      );

      expect(state.permissions['role.employee']).toBe(true);
      expect(state.permissions.canViewOwnTime).toBe(true);
      expect(state.permissions['role.admin']).toBe(false);
      expect(state.permissions.canManageUsers).toBe(false);
    });
  });
});
