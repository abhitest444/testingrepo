// @ts-ignore
import UxPersistentStore from '@app-data/ux-preferences-lib';
import { waitFor } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import { UxPersistentStore as MockUxPersistentStore } from '__mocks__/@app-data/ux-preferences-lib/UxPersistentStore';
import {
  clearUXPreferencesStore,
  DEFAULT_UX_PREFERENCE_DATA_STATE,
  getUxPreferencesStore,
  useUxPreferences,
  UxPreferenceKey,
  TIME_ENTRY_SPLIT_CTA_OPTIONS,
  UX_PREFERENCE_KEY_CONTEXT_MAP,
  getUxPreferenceContext,
} from 'src/js/service/utils/useUXPreferences';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';

jest.mock('@app-data/ux-preferences-lib');

const mockUxPersistentStore = new MockUxPersistentStore();

describe('useUxPreferences', () => {
  afterEach(() => {
    jest.clearAllMocks();
    clearUXPreferencesStore();
  });
  beforeEach(() => {
    UxPersistentStore.prototype.constructor.mockReturnValue(
      mockUxPersistentStore,
    );
  });

  it('should not be initially loading', async () => {
    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      useUxPreferences(),
    );

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(result.current.loading).toBe(false);
  });

  it('should initialize UxPersistentStore successfully', async () => {
    const { waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      useUxPreferences(),
    );

    await act(async () => {
      await waitForNextUpdate();
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(getUxPreferencesStore()).toBeDefined();
  });

  describe('loadPreferences', () => {
    it('should load preferences successfully', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );
      await act(async () => {
        await waitForNextUpdate();
      });

      const resolveFns: ((value: any) => void)[] = [];
      jest.spyOn(mockUxPersistentStore, 'getPreference').mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFns.push(resolve);
          }),
      );

      expect(result.current.loading).toBe(false);

      let loadPrefsPromise: Promise<void>;
      act(() => {
        loadPrefsPromise = result.current.loadPreferences([
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
          UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS,
          UxPreferenceKey.TIME_ENTRY_TIME_FOR,
        ]);
      });

      await waitFor(() => expect(resolveFns.length === 3));

      expect(result.current.loading).toBe(true);
      resolveFns[0](
        DEFAULT_UX_PREFERENCE_DATA_STATE[
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE
        ],
      );

      expect(result.current.loading).toBe(true);
      resolveFns[1](null);

      expect(result.current.loading).toBe(true);
      resolveFns[2](
        DEFAULT_UX_PREFERENCE_DATA_STATE[UxPreferenceKey.TIME_ENTRY_TIME_FOR],
      );

      await act(async () => {
        await loadPrefsPromise;
      });

      expect(result.current.loading).toBe(false);
      expect(
        result.current.data[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE],
      ).toEqual(
        DEFAULT_UX_PREFERENCE_DATA_STATE[
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE
        ],
      );
      expect(result.current.data[UxPreferenceKey.TIME_ENTRY_TIME_FOR]).toEqual(
        DEFAULT_UX_PREFERENCE_DATA_STATE[UxPreferenceKey.TIME_ENTRY_TIME_FOR],
      );
    });

    it('returns the timeFor employee default if the timeFor preference default is Vendor and First Name', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const resolveFns: ((value: any) => void)[] = [];
      jest.spyOn(mockUxPersistentStore, 'getPreference').mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFns.push(resolve);
          }),
      );

      expect(result.current.loading).toBe(false);

      let loadPrefsPromise: Promise<void> = new Promise(() => {});
      await act(async () => {
        loadPrefsPromise = result.current.loadPreferences([
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
          UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS,
          UxPreferenceKey.TIME_ENTRY_TIME_FOR,
        ]);
      });

      await waitFor(() => expect(resolveFns.length === 3));

      expect(result.current.loading).toBe(true);
      resolveFns[0](
        DEFAULT_UX_PREFERENCE_DATA_STATE[
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE
        ],
      );

      expect(result.current.loading).toBe(true);
      resolveFns[1](null);

      resolveFns[2]({ id: 1, name: 'First Worker', type: 'vendor' });

      await act(async () => {
        loadPrefsPromise.then(() => {
          expect(
            result.current.data[UxPreferenceKey.TIME_ENTRY_TIME_FOR],
          ).toEqual(
            DEFAULT_UX_PREFERENCE_DATA_STATE[
              UxPreferenceKey.TIME_ENTRY_TIME_FOR
            ],
          );
        });
      });
    });

    it('returns the timeFor employee default if the timeFor preference default is Employee and TimeTracking Only', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const resolveFns: ((value: any) => void)[] = [];
      jest.spyOn(mockUxPersistentStore, 'getPreference').mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFns.push(resolve);
          }),
      );

      expect(result.current.loading).toBe(false);

      let loadPrefsPromise: Promise<void> = new Promise(() => {});
      await act(async () => {
        loadPrefsPromise = result.current.loadPreferences([
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
          UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS,
          UxPreferenceKey.TIME_ENTRY_TIME_FOR,
        ]);
      });

      await waitFor(() => expect(resolveFns.length === 3));

      expect(result.current.loading).toBe(true);
      resolveFns[0](
        DEFAULT_UX_PREFERENCE_DATA_STATE[
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE
        ],
      );

      expect(result.current.loading).toBe(true);
      resolveFns[1](null);

      resolveFns[2]({ id: 1, name: 'TimeTracking Only', type: 'employee' });

      await act(async () => {
        loadPrefsPromise.then(() => {
          expect(
            result.current.data[UxPreferenceKey.TIME_ENTRY_TIME_FOR],
          ).toEqual(
            DEFAULT_UX_PREFERENCE_DATA_STATE[
              UxPreferenceKey.TIME_ENTRY_TIME_FOR
            ],
          );
        });
      });
    });

    it('sets an error if one of the preferences fails to load after all retries', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const getPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'getPreference',
      );

      // First preference succeeds immediately
      getPreferenceSpy.mockResolvedValueOnce({ isSundayHidden: true });

      // Second preference succeeds immediately
      getPreferenceSpy.mockResolvedValueOnce(null);

      // Third preference fails all 3 attempts (initial + 2 retries)
      getPreferenceSpy.mockRejectedValueOnce(
        new Error('Failed to load preference'),
      );
      getPreferenceSpy.mockRejectedValueOnce(
        new Error('Failed to load preference'),
      );
      getPreferenceSpy.mockRejectedValueOnce(
        new Error('Failed to load preference'),
      );

      await act(async () => {
        await result.current.loadPreferences([
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
          UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS,
          UxPreferenceKey.TIME_ENTRY_TIME_FOR,
        ]);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
      // getPreference should have been called 5 times total:
      // 1 for first pref + 1 for second pref + 3 for third pref (initial + 2 retries)
      expect(getPreferenceSpy).toHaveBeenCalledTimes(5);
      // When Promise.all fails, none of the data is set - it remains at default state
      expect(
        result.current.data[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]
          .isSundayHidden,
      ).toBe(false);

      // Default value remains unchanged
      expect(result.current.data[UxPreferenceKey.TIME_ENTRY_TIME_FOR]).toEqual(
        DEFAULT_UX_PREFERENCE_DATA_STATE[UxPreferenceKey.TIME_ENTRY_TIME_FOR],
      );
    }, 10000);

    it('should retry loadPreferences on failure up to 3 times', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const getPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'getPreference',
      );

      // Fail twice, then succeed
      getPreferenceSpy
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ isSundayHidden: true });

      await act(async () => {
        await result.current.loadPreferences([
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
        ]);
      });

      // Should have been called 3 times (initial + 2 retries)
      expect(getPreferenceSpy).toHaveBeenCalledTimes(3);

      // Should succeed eventually
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('getPreference', () => {
    it('should retry getPreference on failure up to 3 times', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const getPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'getPreference',
      );

      // Fail twice, then succeed
      getPreferenceSpy
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ isSundayHidden: true });

      await act(async () => {
        await result.current.getPreference(
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
        );
      });

      // Should have been called 3 times (initial + 2 retries)
      expect(getPreferenceSpy).toHaveBeenCalledTimes(3);

      // Should succeed eventually
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('setPreference', () => {
    it('should retry setPreference on failure up to 3 times', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const setPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'setPreference',
      );

      // Fail twice, then succeed
      setPreferenceSpy
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.setPreference(
          UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA,
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.key,
        );
      });

      // Should have been called 3 times (initial + 2 retries)
      expect(setPreferenceSpy).toHaveBeenCalledTimes(3);

      // Should succeed eventually
      expect(result.current.error).toBeUndefined();
      expect(
        result.current.data[UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA],
      ).toBe(TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.key);
    });

    it('should fail after exhausting all retries', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const setPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'setPreference',
      );

      // Fail all attempts
      setPreferenceSpy.mockRejectedValue(new Error('Persistent network error'));

      await act(async () => {
        await result.current.setPreference(
          UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA,
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.key,
        );
      });

      // Should have been called 3 times (initial + 2 retries)
      expect(setPreferenceSpy).toHaveBeenCalledTimes(3);

      // Should have error set
      expect(result.current.error).toBeDefined();
    });
  });

  describe('setPreferences', () => {
    it('should retry setPreferences on failure up to 3 times per preference', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const setPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'setPreference',
      );

      // Fail twice for first preference, then succeed
      setPreferenceSpy
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.setPreferences({
          [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]:
            TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.key,
        });
      });

      // Should have been called 3 times (initial + 2 retries)
      expect(setPreferenceSpy).toHaveBeenCalledTimes(3);

      // Should succeed eventually
      expect(result.current.error).toBeUndefined();
      expect(
        result.current.data[UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA],
      ).toBe(TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.key);
    });
  });

  describe('TIME_ENTRY_SPLIT_CTA_OPTIONS', () => {
    it('should have all three split CTA options defined', () => {
      expect(TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE).toBeDefined();
      expect(TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW).toBeDefined();
      expect(TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_COPY).toBeDefined();
    });

    it('should have correct structure for SAVE_AND_CLOSE option', () => {
      expect(TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE).toEqual({
        key: 'saveAndClose',
        labelKey: 'save.and.close',
        value: 'saveAndClose',
      });
    });

    it('should have correct structure for SAVE_AND_NEW option', () => {
      expect(TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW).toEqual({
        key: 'saveAndNew',
        labelKey: 'save.and.new',
        value: 'saveAndNew',
      });
    });

    it('should have correct structure for SAVE_AND_COPY option', () => {
      expect(TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_COPY).toEqual({
        key: 'saveAndCopy',
        labelKey: 'save.and.copy',
        value: 'saveAndCopy',
      });
    });

    it('should have unique keys for all options', () => {
      const keys = [
        TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.key,
        TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW.key,
        TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_COPY.key,
      ];
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(3);
    });

    it('should have unique values for all options', () => {
      const values = [
        TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.value,
        TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW.value,
        TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_COPY.value,
      ];
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(3);
    });
  });

  describe('TIME_ENTRY_SELECTED_SPLIT_CTA preference', () => {
    it('should load TIME_ENTRY_SELECTED_SPLIT_CTA preference successfully', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const resolveFns: ((value: any) => void)[] = [];
      jest.spyOn(mockUxPersistentStore, 'getPreference').mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFns.push(resolve);
          }),
      );

      let loadPrefsPromise: Promise<void>;
      act(() => {
        loadPrefsPromise = result.current.loadPreferences([
          UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA,
        ]);
      });

      await waitFor(() => expect(resolveFns.length === 1));

      expect(result.current.loading).toBe(true);
      resolveFns[0](TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_COPY.key);

      await act(async () => {
        await loadPrefsPromise;
      });

      expect(result.current.loading).toBe(false);
      expect(
        result.current.data[UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA],
      ).toBe(TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_COPY.key);
    });

    it('should set TIME_ENTRY_SELECTED_SPLIT_CTA preference successfully', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const setPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'setPreference',
      );
      setPreferenceSpy.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.setPreference(
          UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA,
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW.key,
        );
      });

      expect(setPreferenceSpy).toHaveBeenCalledWith(
        UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA,
        TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW.key,
        'USER',
      );
      expect(
        result.current.data[UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA],
      ).toBe(TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW.key);
    });

    it('should handle error when setting TIME_ENTRY_SELECTED_SPLIT_CTA preference', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const setPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'setPreference',
      );
      setPreferenceSpy.mockRejectedValue(
        new Error('Failed to save preference'),
      );

      await act(async () => {
        await result.current.setPreference(
          UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA,
          TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_CLOSE.key,
        );
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error).toBe(
        'NLS catch.all.error.content undefined',
      );
    });

    it('should have default value for TIME_ENTRY_SELECTED_SPLIT_CTA', () => {
      expect(
        DEFAULT_UX_PREFERENCE_DATA_STATE[
          UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA
        ],
      ).toBe(TIME_ENTRY_SPLIT_CTA_OPTIONS.SAVE_AND_NEW.key);
    });
  });

  describe('TIME_ENTRY_NEW_BADGE_VISIBLE preference with overtimeVisibilityEndDate', () => {
    it('should load TIME_ENTRY_NEW_BADGE_VISIBLE preference with overtimeVisibilityEndDate successfully', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const resolveFns: ((value: any) => void)[] = [];
      jest.spyOn(mockUxPersistentStore, 'getPreference').mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFns.push(resolve);
          }),
      );

      let loadPrefsPromise: Promise<void>;
      act(() => {
        loadPrefsPromise = result.current.loadPreferences([
          UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE,
        ]);
      });

      await waitFor(() => expect(resolveFns.length === 1));

      expect(result.current.loading).toBe(true);
      const mockBadgeVisibility = {
        overtimeVisibilityEndDate: '2025-01-01',
      };
      resolveFns[0](mockBadgeVisibility);

      await act(async () => {
        await loadPrefsPromise;
      });

      expect(result.current.loading).toBe(false);
      expect(
        result.current.data[UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE],
      ).toEqual(mockBadgeVisibility);
      expect(
        result.current.data[UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]
          .overtimeVisibilityEndDate,
      ).toBe('2025-01-01');
    });

    it('should set TIME_ENTRY_NEW_BADGE_VISIBLE preference with overtimeVisibilityEndDate successfully', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const setPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'setPreference',
      );
      setPreferenceSpy.mockResolvedValue(undefined);

      const updatedBadgeVisibility = {
        overtimeVisibilityEndDate: '2025-02-01',
      };

      await act(async () => {
        await result.current.setPreference(
          UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE,
          updatedBadgeVisibility,
        );
      });

      expect(setPreferenceSpy).toHaveBeenCalledWith(
        UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE,
        updatedBadgeVisibility,
        'USER',
      );
      expect(
        result.current.data[UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE],
      ).toEqual(updatedBadgeVisibility);
      expect(
        result.current.data[UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]
          .overtimeVisibilityEndDate,
      ).toBe('2025-02-01');
    });

    it('should handle error when setting TIME_ENTRY_NEW_BADGE_VISIBLE preference with overtimeVisibilityEndDate', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const setPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'setPreference',
      );
      setPreferenceSpy.mockRejectedValue(
        new Error('Failed to save preference'),
      );

      const badgeVisibility = {
        overtimeVisibilityEndDate: '2025-03-01',
      };

      await act(async () => {
        await result.current.setPreference(
          UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE,
          badgeVisibility,
        );
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error).toBe(
        'NLS catch.all.error.content undefined',
      );
    });

    it('should have default value for TIME_ENTRY_NEW_BADGE_VISIBLE with overtimeVisibilityEndDate', () => {
      const defaultValue =
        DEFAULT_UX_PREFERENCE_DATA_STATE[
          UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE
        ];

      expect(defaultValue).toBeDefined();
      expect(defaultValue.overtimeVisibilityEndDate).toBe('');
    });

    it('should include overtimeVisibilityEndDate in TIME_ENTRY_NEW_BADGE_VISIBLE default state', () => {
      const defaultValue =
        DEFAULT_UX_PREFERENCE_DATA_STATE[
          UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE
        ];

      expect(defaultValue).toHaveProperty('overtimeVisibilityEndDate');
      expect(defaultValue.overtimeVisibilityEndDate).toBe('');
    });

    it('should update only overtimeVisibilityEndDate using setPreferences', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const setPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'setPreference',
      );
      setPreferenceSpy.mockResolvedValue(undefined);

      const partialUpdate = {
        [UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]: {
          ...DEFAULT_UX_PREFERENCE_DATA_STATE[
            UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE
          ],
          overtimeVisibilityEndDate: '2025-12-31',
        },
      };

      await act(async () => {
        await result.current.setPreferences(partialUpdate);
      });

      expect(setPreferenceSpy).toHaveBeenCalledWith(
        UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE,
        partialUpdate[UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE],
        'USER',
      );
      expect(
        result.current.data[UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]
          .overtimeVisibilityEndDate,
      ).toBe('2025-12-31');
    });
  });

  describe('UX_PREFERENCE_KEY_CONTEXT_MAP', () => {
    it('should have context mapping for all UxPreferenceKeys', () => {
      const preferenceKeys = Object.values(UxPreferenceKey);
      preferenceKeys.forEach((key) => {
        expect(UX_PREFERENCE_KEY_CONTEXT_MAP[key]).toBeDefined();
      });
    });

    it('should map TIME_ENTRY_TIME_FOR to USER_REALM context', () => {
      expect(
        UX_PREFERENCE_KEY_CONTEXT_MAP[UxPreferenceKey.TIME_ENTRY_TIME_FOR],
      ).toBe('USER_REALM');
    });

    it('should map most preferences to USER context', () => {
      expect(
        UX_PREFERENCE_KEY_CONTEXT_MAP[UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE],
      ).toBe('USER');
      expect(
        UX_PREFERENCE_KEY_CONTEXT_MAP[
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE
        ],
      ).toBe('USER');
      expect(
        UX_PREFERENCE_KEY_CONTEXT_MAP[
          UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA
        ],
      ).toBe('USER');
    });
  });

  describe('getUxPreferenceContext', () => {
    it('should return USER_REALM for TIME_ENTRY_TIME_FOR', () => {
      expect(getUxPreferenceContext(UxPreferenceKey.TIME_ENTRY_TIME_FOR)).toBe(
        'USER_REALM',
      );
    });

    it('should return USER for other preference keys', () => {
      expect(
        getUxPreferenceContext(UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE),
      ).toBe('USER');
      expect(
        getUxPreferenceContext(UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA),
      ).toBe('USER');
      expect(
        getUxPreferenceContext(UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED),
      ).toBe('USER');
    });

    it('should return USER as default for unmapped keys', () => {
      // @ts-ignore - testing fallback behavior
      expect(getUxPreferenceContext('unmapped-key')).toBe('USER');
    });
  });

  describe('Context parameter usage in hooks', () => {
    it('should call getPreference with correct context in loadPreferences', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const getPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'getPreference',
      );
      getPreferenceSpy.mockResolvedValue(null);

      await act(async () => {
        await result.current.loadPreferences([
          UxPreferenceKey.TIME_ENTRY_TIME_FOR,
          UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE,
        ]);
      });

      expect(getPreferenceSpy).toHaveBeenCalledWith(
        UxPreferenceKey.TIME_ENTRY_TIME_FOR,
        'USER_REALM',
      );
      expect(getPreferenceSpy).toHaveBeenCalledWith(
        UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE,
        'USER',
      );
    });

    it('should call getPreference with correct context in getPreference', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const getPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'getPreference',
      );
      getPreferenceSpy.mockResolvedValue({ isSundayHidden: true });

      await act(async () => {
        await result.current.getPreference(
          UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
        );
      });

      expect(getPreferenceSpy).toHaveBeenCalledWith(
        UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
        'USER',
      );
    });

    it('should call setPreference with correct context in setPreference', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const setPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'setPreference',
      );
      setPreferenceSpy.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.setPreference(
          UxPreferenceKey.TIME_ENTRY_TIME_FOR,
          { id: '2', name: 'Test', type: 'employee' },
        );
      });

      expect(setPreferenceSpy).toHaveBeenCalledWith(
        UxPreferenceKey.TIME_ENTRY_TIME_FOR,
        { id: '2', name: 'Test', type: 'employee' },
        'USER_REALM',
      );
    });

    it('should call setPreference with correct context in setPreferences', async () => {
      const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
        () => useUxPreferences(),
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const setPreferenceSpy = jest.spyOn(
        mockUxPersistentStore,
        'setPreference',
      );
      setPreferenceSpy.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.setPreferences({
          [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: {
            id: '3',
            name: 'Test',
            type: 'employee',
          },
          [UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE]: true,
        });
      });

      expect(setPreferenceSpy).toHaveBeenCalledWith(
        UxPreferenceKey.TIME_ENTRY_TIME_FOR,
        { id: '3', name: 'Test', type: 'employee' },
        'USER_REALM',
      );
      expect(setPreferenceSpy).toHaveBeenCalledWith(
        UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE,
        true,
        'USER',
      );
    });
  });
});
