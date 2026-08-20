import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Identity_EntitlementGrant } from 'src/__generated__/oigql/graphql';
import QualtricsSurveyWidget from 'src/js/widgets/common/feedbackSurvey/QualtricsSurveyWidget';

const mockWidget = jest.fn((props: any) => (
  <div data-testid="hoc-widget-mock" data-feature-tag={props.featureTag} />
));

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: (props: any) => mockWidget(props),
}));

describe('QualtricsSurveyWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes widget props to HOCWidget', () => {
    const registerLoadSurvey = jest.fn();
    const mockSandbox = {} as any;
    const activeEmployer = {
      employerId: '123',
      product: 'US-Online',
      entitlementGrants: [{} as Identity_EntitlementGrant],
    };

    render(
      <QualtricsSurveyWidget
        sandbox={mockSandbox}
        featureTag="wfs-wfweb-sta"
        registerLoadSurvey={registerLoadSurvey}
        activeEmployer={activeEmployer}
      />,
    );

    expect(screen.getByTestId('hoc-widget-mock')).toBeInTheDocument();
    expect(mockWidget).toHaveBeenCalledWith(
      expect.objectContaining({
        widgetId: 'employee-management-ui/hcmQualtricsSurvey',
        sandbox: mockSandbox,
        featureTag: 'wfs-wfweb-sta',
        registerLoadSurvey: expect.any(Function),
        activeEmployer,
      }),
    );
  });

  it('forwards loadSurvey callback through registerLoadSurvey', () => {
    const registerLoadSurvey = jest.fn();
    const loadSurvey = jest.fn().mockResolvedValue(undefined);

    render(
      <QualtricsSurveyWidget
        sandbox={{} as any}
        featureTag="wfs-wfweb-wta"
        registerLoadSurvey={registerLoadSurvey}
      />,
    );

    const widgetProps =
      mockWidget.mock.calls[mockWidget.mock.calls.length - 1][0];
    widgetProps.registerLoadSurvey(loadSurvey);

    expect(registerLoadSurvey).toHaveBeenCalledWith(loadSurvey);
  });
});
