import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FeatureRouter from 'src/js/widgets/qbtOrchestrator/components/FeatureRouter';
import {
  FEATURE_NAMES,
  FUNCTIONALITY_NAMES,
} from 'src/js/widgets/qbtOrchestrator/constants';

jest.mock('src/js/widgets/qbtOrchestrator/features/overtime', () => ({
  __esModule: true,
  default: () => <div data-testid="overtime-feature-mock" />,
}));

jest.mock('src/js/widgets/qbtOrchestrator/features/approvals', () => ({
  __esModule: true,
  default: () => <div data-testid="approvals-feature-mock" />,
}));

jest.mock('src/js/widgets/qbtOrchestrator/features/timeKiosk', () => ({
  __esModule: true,
  default: ({
    functionality,
    isEditable,
  }: {
    functionality?: string;
    isEditable?: boolean;
  }) => (
    <div data-testid="time-kiosk-feature-mock">
      <span data-testid="time-kiosk-router-functionality">
        {functionality ?? 'none'}
      </span>
      <span data-testid="time-kiosk-router-editable">
        {isEditable === undefined ? 'undefined' : String(isEditable)}
      </span>
    </div>
  ),
}));

const renderRouter = (ui: React.ReactElement) =>
  render(
    <Suspense fallback={<div data-testid="suspense-fallback" />}>
      {ui}
    </Suspense>,
  );

describe('FeatureRouter', () => {
  it('should render TimeKioskFeature for time-kiosk', async () => {
    renderRouter(
      <FeatureRouter
        feature={FEATURE_NAMES.TIME_KIOSK}
        functionality={FUNCTIONALITY_NAMES.KIOSK_SETTINGS_HANDLE}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('time-kiosk-feature-mock')).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('time-kiosk-router-functionality'),
    ).toHaveTextContent(FUNCTIONALITY_NAMES.KIOSK_SETTINGS_HANDLE);
  });

  it('should pass isEditable to TimeKioskFeature', async () => {
    renderRouter(
      <FeatureRouter
        feature={FEATURE_NAMES.TIME_KIOSK}
        functionality={FUNCTIONALITY_NAMES.KIOSK_SETTINGS_HANDLE}
        isEditable={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('time-kiosk-feature-mock')).toBeInTheDocument();
    });
    expect(screen.getByTestId('time-kiosk-router-editable')).toHaveTextContent(
      'false',
    );
  });

  it('should render OvertimeFeature for overtime', async () => {
    renderRouter(<FeatureRouter feature={FEATURE_NAMES.OVERTIME} />);

    await waitFor(() => {
      expect(screen.getByTestId('overtime-feature-mock')).toBeInTheDocument();
    });
  });

  it('should render ApprovalsFeature for approvals', async () => {
    renderRouter(<FeatureRouter feature={FEATURE_NAMES.APPROVALS} />);

    await waitFor(() => {
      expect(screen.getByTestId('approvals-feature-mock')).toBeInTheDocument();
    });
  });

  it('should render unknown feature message', () => {
    renderRouter(<FeatureRouter feature="not-a-real-feature" />);

    expect(
      screen.getByText('Unknown feature: not-a-real-feature'),
    ).toBeInTheDocument();
  });
});
