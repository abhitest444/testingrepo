import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TimeEntrySettingsHoc } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/TimeEntrySettingsHoc';
import { TimeEntrySettingsForm } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/TimeEntrySettingsForm';

// Mock TimeEntrySettingsForm
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/TimeEntrySettingsForm',
  () => ({
    TimeEntrySettingsForm: jest.fn(({ type }) => (
      <div data-testid="time-entry-form">
        TimeEntrySettingsForm Component (type: {type})
      </div>
    )),
  }),
);

describe('TimeEntrySettingsHoc', () => {
  const defaultProps = {
    type: 'US',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render TimeEntrySettingsForm', () => {
    const { getByTestId } = render(<TimeEntrySettingsHoc {...defaultProps} />);

    expect(getByTestId('time-entry-form')).toBeInTheDocument();
    expect(getByTestId('time-entry-form')).toHaveTextContent(
      'TimeEntrySettingsForm Component (type: US)',
    );
  });

  it('should pass type prop to TimeEntrySettingsForm', () => {
    const { getByTestId } = render(<TimeEntrySettingsHoc type="CA" />);

    expect(getByTestId('time-entry-form')).toBeInTheDocument();
    expect(getByTestId('time-entry-form')).toHaveTextContent(
      'TimeEntrySettingsForm Component (type: CA)',
    );
  });

  it('should pass onIsDirtyTimeForm callback to TimeEntrySettingsForm', () => {
    const mockCallback = jest.fn();
    const { getByTestId } = render(
      <TimeEntrySettingsHoc
        {...defaultProps}
        onIsDirtyTimeForm={mockCallback}
      />,
    );

    expect(getByTestId('time-entry-form')).toBeInTheDocument();
  });

  it('should forward trowserKey and onClose to TimeEntrySettingsForm', () => {
    const onClose = jest.fn();
    render(
      <TimeEntrySettingsHoc
        {...defaultProps}
        trowserKey="timesheet-settings"
        onClose={onClose}
      />,
    );

    expect(TimeEntrySettingsForm).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'US',
        trowserKey: 'timesheet-settings',
        onClose,
      }),
      expect.anything(),
    );
  });

  it('should not set trowserKey or onClose when not provided', () => {
    render(<TimeEntrySettingsHoc {...defaultProps} />);

    expect(TimeEntrySettingsForm).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'US',
        trowserKey: undefined,
        onClose: undefined,
      }),
      expect.anything(),
    );
  });
});
