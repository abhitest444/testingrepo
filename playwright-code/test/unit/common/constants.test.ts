import {
  FEATURE_FLAGS,
  INTUIT_TID,
  PREFERENCES_ENDPOINT,
  VENDOR_ENDPOINT,
  VENDOR_ENDPOINT_MINORVERSION,
  MAX_BREAK_DURATION,
  RECENT_TIME_RECORDS_LIMIT,
  MAX_WORK_DURATION_MINUTES,
  MAX_NOTES_LENGTH,
  TEAM_MEMBER_FIELD_WIDTH,
  WEEK_FIELD_WIDTH,
  NOTES_FIELD_ROWS,
  JOB_DETAIL_WIDTH,
  LOOKUP_INTERVAL_FOR_COPY_LAST_TIMESHEET_IN_MONTHS,
  MAX_TIME_ENTRY_DURATION,
  setAfterTaskModalPending,
} from 'src/js/common/constants';

test('INTUIT_TID should be defined and have correct value', () => {
  expect(INTUIT_TID).toBeDefined();
  expect(INTUIT_TID).toBe('intuit_tid');
});

test('PREFERENCES_ENDPOINT should be defined and have correct value', () => {
  expect(PREFERENCES_ENDPOINT).toBeDefined();
  expect(PREFERENCES_ENDPOINT).toBe('preferences?minorversion=74');
});

test('VENDOR_ENDPOINT should be defined and have correct value', () => {
  expect(VENDOR_ENDPOINT).toBeDefined();
  expect(VENDOR_ENDPOINT).toBe('vendor');
});

test('VENDOR_ENDPOINT_MINORVERSION should be defined and have correct value', () => {
  expect(VENDOR_ENDPOINT_MINORVERSION).toBeDefined();
  expect(VENDOR_ENDPOINT_MINORVERSION).toBe('73');
});

test('MAX_BREAK_DURATION should be defined and have correct value', () => {
  expect(MAX_BREAK_DURATION).toBeDefined();
  expect(MAX_BREAK_DURATION).toBe(86400);
});

test('MAX_TIME_ENTRY_DURATION should be defined and have correct value', () => {
  expect(MAX_TIME_ENTRY_DURATION).toBeDefined();
  expect(MAX_TIME_ENTRY_DURATION).toBe(86400);
});

test('RECENT_TIME_ACTIVITIES_LIMIT should be defined and have correct value', () => {
  expect(RECENT_TIME_RECORDS_LIMIT).toBeDefined();
  expect(RECENT_TIME_RECORDS_LIMIT).toBe(20);
});

test('MAX_WORK_DURATION_MINUTES should be defined and have correct value', () => {
  expect(MAX_WORK_DURATION_MINUTES).toBeDefined();
  expect(MAX_WORK_DURATION_MINUTES).toBe(525600);
});

test('MAX_NOTES_LENGTH should be defined and have correct value', () => {
  expect(MAX_NOTES_LENGTH).toBeDefined();
  expect(MAX_NOTES_LENGTH).toBe(4000);
});

test('TEAM_MEMBER_FIELD_WIDTH should be defined and have correct value', () => {
  expect(TEAM_MEMBER_FIELD_WIDTH).toBeDefined();
  expect(TEAM_MEMBER_FIELD_WIDTH).toBe(224);
});

test('WEEK_FIELD_WIDTH should be defined and have correct value', () => {
  expect(WEEK_FIELD_WIDTH).toBeDefined();
  expect(WEEK_FIELD_WIDTH).toBe(214);
});

test('NOTES_FIELD_ROWS should be defined and have correct value', () => {
  expect(NOTES_FIELD_ROWS).toBeDefined();
  expect(NOTES_FIELD_ROWS).toBe(2);
});

test('JOB_DETAIL_WIDTH should be defined and have correct value', () => {
  expect(JOB_DETAIL_WIDTH).toBeDefined();
  expect(JOB_DETAIL_WIDTH).toBe(177);
});

test('LOOKUP_INTERVAL_FOR_COPY_LAST_TIMESHEET_IN_MONTHS should be defined and have correct value', () => {
  expect(LOOKUP_INTERVAL_FOR_COPY_LAST_TIMESHEET_IN_MONTHS).toBeDefined();
  expect(LOOKUP_INTERVAL_FOR_COPY_LAST_TIMESHEET_IN_MONTHS).toBe(2);
});

describe('setAfterTaskModalPending', () => {
  it('should call sandbox persistent webStorage with the correct namespace and key', () => {
    const mockSetItemByPersonaId = jest.fn();
    const mockPersistent = jest.fn().mockReturnValue({
      setItemByPersonaId: mockSetItemByPersonaId,
    });
    const mockSandbox = {
      extensions: {
        qbo: {
          webStorage: {
            persistent: mockPersistent,
          },
        },
      },
    } as any;

    setAfterTaskModalPending(mockSandbox);

    expect(mockPersistent).toHaveBeenCalledWith('timecapture');
    expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
      'fode-timeentry-aftertask-modal-pending',
      expect.any(String),
    );
  });

  it('should store a timestamp string', () => {
    const mockSetItemByPersonaId = jest.fn();
    const mockSandbox = {
      extensions: {
        qbo: {
          webStorage: {
            persistent: jest.fn().mockReturnValue({
              setItemByPersonaId: mockSetItemByPersonaId,
            }),
          },
        },
      },
    } as any;

    const before = Date.now();
    setAfterTaskModalPending(mockSandbox);
    const after = Date.now();

    const storedValue = Number(mockSetItemByPersonaId.mock.calls[0][1]);
    expect(storedValue).toBeGreaterThanOrEqual(before);
    expect(storedValue).toBeLessThanOrEqual(after);
  });
});
