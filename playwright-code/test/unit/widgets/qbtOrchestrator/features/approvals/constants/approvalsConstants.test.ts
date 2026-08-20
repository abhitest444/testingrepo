import {
  APPROVALS_FUNCTIONALITY,
  SUBMIT_TIME_PANEL_DEFAULTS,
} from 'src/js/widgets/qbtOrchestrator/features/approvals/constants/approvalsConstants';
import { APPROVALS_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/approvals/constants/approvalsLoggingConstants';

describe('approvals constants', () => {
  it('has stable functionality and defaults', () => {
    expect(APPROVALS_FUNCTIONALITY.SUBMIT_TIME_PANEL).toBe('submit-time-panel');
    expect(SUBMIT_TIME_PANEL_DEFAULTS).toEqual({
      TITLE: 'Submit time',
    });
  });

  it('has expected logging keys', () => {
    expect(APPROVALS_LOGGING.FEATURE_MOUNTED).toContain('ApprovalsFeature');
    expect(APPROVALS_LOGGING.UNKNOWN_FUNCTIONALITY).toContain(
      'UnknownFunctionality',
    );
    expect(APPROVALS_LOGGING.API_SUBMIT_TIME_SUCCESS).toContain(
      'SubmitTimeSuccess',
    );
    expect(APPROVALS_LOGGING.SUBMIT_TIME_PANEL_DATE_CHANGED).toContain(
      'SubmitThroughDateChanged',
    );
    expect(APPROVALS_LOGGING.SUBMIT_TIME_PANEL_WEEK_TOGGLED).toContain(
      'WeekToggled',
    );
  });
});
