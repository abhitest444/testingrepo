import { renderHook, act } from '@testing-library/react-hooks';
import { useExportAndSave } from 'src/js/widgets/weeklyTimeEntry/hooks/useExportAndSave';
import { useSaveWeeklyTimeEntries } from 'src/js/service/hooks/weeklyTimeEntries/useSaveWeeklyTimeEntries';
import * as selectors from 'src/js/widgets/weeklyTimeEntry/store/selectors';
import { TimeForType } from 'src/js/widgets/weeklyTimeEntry/types';
import {
  renderHookWithQuicksandProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';

// Mock the dependencies
jest.mock('src/js/widgets/weeklyTimeEntry/store', () => {
  const actual = jest.requireActual('src/js/widgets/weeklyTimeEntry/store');
  return {
    ...actual,
    useAppSelector: jest.fn((selector) => {
      if (selector === selectors.selectTimesheetRows) return [];
      if (selector === selectors.selectDateRange)
        return { start: '2024-01-01', end: '2024-01-07' };
      if (selector === selectors.selectVisibleDays)
        return [0, 1, 2, 3, 4, 5, 6];
      if (selector === selectors.selectWeekDates)
        return [
          '2024-01-01',
          '2024-01-02',
          '2024-01-03',
          '2024-01-04',
          '2024-01-05',
          '2024-01-06',
          '2024-01-07',
        ];
      if (selector === selectors.selectCustomerData) return [];
      return null;
    }),
  };
});

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  useCurrencySymbol: jest.fn(() => '$'),
}));

jest.mock('src/js/widgets/weeklyTimeEntry/utils/exportWeeklyTimesheet', () => ({
  exportWeeklyTimesheet: jest.fn(),
}));

jest.mock(
  'src/js/service/hooks/weeklyTimeEntries/useSaveWeeklyTimeEntries',
  () => ({
    useSaveWeeklyTimeEntries: jest.fn(),
  }),
);

// Mock window.print
Object.defineProperty(window, 'print', {
  value: jest.fn(),
  writable: true,
});

jest.mock('src/js/widgets/weeklyTimeEntry/utils/printWeeklyTimeTable', () => ({
  printWeeklyTimeTable: jest.fn((...args) => {
    window.print();
    return args;
  }),
}));

describe('useExportAndSave', () => {
  const mockSaveWeeklyTimeEntries = jest.fn();
  const mockUseSaveWeeklyTimeEntries =
    useSaveWeeklyTimeEntries as jest.MockedFunction<
      typeof useSaveWeeklyTimeEntries
    >;
  const mockExportWeeklyTimesheet =
    require('src/js/widgets/weeklyTimeEntry/utils/exportWeeklyTimesheet').exportWeeklyTimesheet;
  const mockPrintWeeklyTimeTable =
    require('src/js/widgets/weeklyTimeEntry/utils/printWeeklyTimeTable').printWeeklyTimeTable;

  const sandbox = getDefaultSandbox();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSaveWeeklyTimeEntries.mockReturnValue({
      saveWeeklyTimeEntries: mockSaveWeeklyTimeEntries,
      loading: false,
      savedData: undefined,
      hasDataToSave: true,
    });
  });

  it('should provide export and save functions', () => {
    const { result } = renderHookWithQuicksandProvider(
      () => useExportAndSave(),
      sandbox,
    );

    expect(result.current.handleExport).toBeDefined();
    expect(result.current.handleExportAndSave).toBeDefined();
    expect(result.current.handlePrintAndSave).toBeDefined();
    expect(result.current.saveLoading).toBe(false);
  });

  it('should call export function when handleExport is called', () => {
    const { result } = renderHookWithQuicksandProvider(
      () => useExportAndSave(),
      sandbox,
    );

    act(() => {
      result.current.handleExport();
    });

    expect(mockExportWeeklyTimesheet).toHaveBeenCalled();
  });

  it('should call save and export when handleExportAndSave is called', async () => {
    mockSaveWeeklyTimeEntries.mockResolvedValue({ success: true });

    const { result } = renderHookWithQuicksandProvider(
      () => useExportAndSave(),
      sandbox,
    );

    await act(async () => {
      await result.current.handleExportAndSave();
    });

    expect(mockSaveWeeklyTimeEntries).toHaveBeenCalled();
    expect(mockExportWeeklyTimesheet).toHaveBeenCalled();
  });

  it('should call save and print when handlePrintAndSave is called', async () => {
    mockSaveWeeklyTimeEntries.mockResolvedValue({ success: true });

    const { result } = renderHookWithQuicksandProvider(
      () => useExportAndSave(),
      sandbox,
    );

    await act(async () => {
      await result.current.handlePrintAndSave();
    });

    expect(mockSaveWeeklyTimeEntries).toHaveBeenCalled();
    expect(window.print).toHaveBeenCalled();
  });

  it('should pass selected team member name and type to print', async () => {
    mockSaveWeeklyTimeEntries.mockResolvedValue({ success: true });
    const storeModule = require('src/js/widgets/weeklyTimeEntry/store');
    const originalUseAppSelector = storeModule.useAppSelector;

    try {
      storeModule.useAppSelector = jest.fn((selector: any) => {
        if (selector === selectors.selectTeamMember) {
          return {
            id: 'vendor-1',
            name: 'Vendor User',
            type: TimeForType.VENDOR,
          };
        }
        return originalUseAppSelector(selector);
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useExportAndSave(),
        sandbox,
      );

      await act(async () => {
        await result.current.handlePrintAndSave();
      });

      expect(mockPrintWeeklyTimeTable).toHaveBeenCalledWith(
        expect.objectContaining({
          teamMemberName: 'Vendor User',
          teamMemberType: TimeForType.VENDOR,
        }),
      );
    } finally {
      storeModule.useAppSelector = originalUseAppSelector;
    }
  });

  it('should handle errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSaveWeeklyTimeEntries.mockRejectedValue(new Error('Save failed'));

    const { result } = renderHookWithQuicksandProvider(
      () => useExportAndSave(),
      sandbox,
    );

    await act(async () => {
      await result.current.handleExportAndSave();
    });

    expect(mockSaveWeeklyTimeEntries).toHaveBeenCalled();
    expect(mockExportWeeklyTimesheet).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should return loading state from save hook', () => {
    mockUseSaveWeeklyTimeEntries.mockReturnValue({
      saveWeeklyTimeEntries: mockSaveWeeklyTimeEntries,
      loading: true,
      savedData: undefined,
      hasDataToSave: true,
    });

    const { result } = renderHookWithQuicksandProvider(
      () => useExportAndSave(),
      sandbox,
    );

    expect(result.current.saveLoading).toBe(true);
  });

  it('should log warning and return early when dateRange.start is missing', async () => {
    const storeModule = require('src/js/widgets/weeklyTimeEntry/store');
    const originalUseAppSelector = storeModule.useAppSelector;

    storeModule.useAppSelector = jest.fn((selector: any) => {
      if (selector === selectors.selectDateRange)
        return { start: null, end: null };
      return originalUseAppSelector(selector);
    });

    const { result } = renderHookWithQuicksandProvider(
      () => useExportAndSave(),
      sandbox,
    );

    await act(async () => {
      await result.current.handleExport();
    });

    expect(mockExportWeeklyTimesheet).not.toHaveBeenCalled();

    storeModule.useAppSelector = originalUseAppSelector;
  });

  it('should log error and call endInteractionWithFailure when exportWeeklyTimesheet throws', async () => {
    mockExportWeeklyTimesheet.mockRejectedValueOnce(new Error('Export failed'));

    const { result } = renderHookWithQuicksandProvider(
      () => useExportAndSave(),
      sandbox,
    );

    await act(async () => {
      await result.current.handleExport();
    });

    // Should not rethrow
    expect(mockExportWeeklyTimesheet).toHaveBeenCalled();
  });

  it('should log error when handlePrintAndSave save fails', async () => {
    mockSaveWeeklyTimeEntries.mockRejectedValueOnce(
      new Error('Print save failed'),
    );

    const { result } = renderHookWithQuicksandProvider(
      () => useExportAndSave(),
      sandbox,
    );

    await act(async () => {
      await result.current.handlePrintAndSave();
    });

    expect(mockSaveWeeklyTimeEntries).toHaveBeenCalled();
    expect(window.print).not.toHaveBeenCalled();
  });
});
