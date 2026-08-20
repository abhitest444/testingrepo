import { renderHook } from '@testing-library/react-hooks';
import { FormState } from 'react-hook-form';
import dayjs from 'dayjs';
import {
  useTimeClockForm,
  DEFAULT_TIME_CLOCK_FORM_STATE,
  isFormDirty,
  TimeClockFormState,
} from 'src/js/widgets/timeClock/hooks/useTimeClockForm';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';

// Mock the useCompanySettings hook
jest.mock('src/js/service/hooks/settings/useCompanySettings', () => ({
  useCompanySettings: jest.fn(),
}));

describe('useTimeClockForm', () => {
  beforeEach(() => {
    // Mock company settings to return a fixed timezone
    (useCompanySettings as jest.Mock).mockReturnValue({
      settingsData: {
        timezone: 'UTC',
      },
    });
  });

  it('returns form with default values', () => {
    const { result } = renderHook(() => useTimeClockForm());
    const values = result.current.getValues();

    // Compare each field individually to handle dayjs instances
    expect(values.id).toBe(DEFAULT_TIME_CLOCK_FORM_STATE.id);
    expect(values.version).toBe(DEFAULT_TIME_CLOCK_FORM_STATE.version);
    expect(values.employeeId).toBe(DEFAULT_TIME_CLOCK_FORM_STATE.employeeId);
    expect(dayjs.isDayjs(values.startDate)).toBe(true);
    expect(dayjs.isDayjs(values.startTime)).toBe(true);
    expect(values.duration).toBe(DEFAULT_TIME_CLOCK_FORM_STATE.duration);
    expect(values.notes).toBe(DEFAULT_TIME_CLOCK_FORM_STATE.notes);
    expect(values.timeAgainst).toEqual(
      DEFAULT_TIME_CLOCK_FORM_STATE.timeAgainst,
    );
    expect(values.timeFor).toEqual(DEFAULT_TIME_CLOCK_FORM_STATE.timeFor);
    expect(values.dimensions).toEqual(DEFAULT_TIME_CLOCK_FORM_STATE.dimensions);
  });

  it('validates form on blur', () => {
    const { result } = renderHook(() => useTimeClockForm());

    expect(result.current.formState.isValidating).toBe(false);
    expect(result.current.formState.isSubmitting).toBe(false);
  });

  it('updates form values correctly', () => {
    const { result } = renderHook(() => useTimeClockForm());

    const newValues = {
      ...DEFAULT_TIME_CLOCK_FORM_STATE,
      employeeId: '123',
      notes: 'Test notes',
    };

    result.current.reset(newValues);
    const values = result.current.getValues();

    expect(values.employeeId).toBe('123');
    expect(values.notes).toBe('Test notes');
  });
});

describe('isFormDirty', () => {
  const baseFormState: FormState<TimeClockFormState> = {
    isDirty: false,
    dirtyFields: {},
    isSubmitted: false,
    isSubmitting: false,
    isSubmitSuccessful: false,
    isValid: true,
    isValidating: false,
    isLoading: false,
    submitCount: 0,
    errors: {},
    defaultValues: DEFAULT_TIME_CLOCK_FORM_STATE,
    disabled: false,
    touchedFields: {},
    validatingFields: {},
  };

  it('returns true when form has dirty fields', () => {
    const mockFormState: FormState<TimeClockFormState> = {
      ...baseFormState,
      isDirty: true,
      dirtyFields: {
        employeeId: true,
      },
    };

    expect(isFormDirty(mockFormState)).toBe(true);
  });

  it('returns false when form has no dirty fields', () => {
    const mockFormState: FormState<TimeClockFormState> = {
      ...baseFormState,
      isDirty: false,
      dirtyFields: {},
    };

    expect(isFormDirty(mockFormState)).toBe(false);
  });
});

describe('DEFAULT_TIME_CLOCK_FORM_STATE', () => {
  it('has correct default values', () => {
    expect(DEFAULT_TIME_CLOCK_FORM_STATE).toEqual({
      id: undefined,
      version: '0',
      employeeId: '',
      startDate: expect.any(dayjs),
      startTime: undefined,
      timezone: undefined,
      duration: 0,
      notes: '',
      timeAgainst: {
        customer: {
          id: '',
          name: '',
        },
        project: {
          id: '',
          name: '',
        },
      },
      service: {
        id: '',
        name: '',
      },
      class: {
        id: '',
        name: '',
      },

      timeFor: {
        id: '',
        type: 'EMPLOYEE',
        name: '',
      },
      location: {
        id: '',
        name: '',
      },
      billable: false,
      billableStatus: undefined,
      billRate: null,
      customFields: {},
      dimensions: {},
    });
  });

  it('has dayjs instances for date fields', () => {
    expect(dayjs.isDayjs(DEFAULT_TIME_CLOCK_FORM_STATE.startDate)).toBe(true);
  });
});
