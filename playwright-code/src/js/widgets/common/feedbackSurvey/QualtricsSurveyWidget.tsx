import React from 'react';
import Widget from 'web-shell-core/widgets/HOCWidget';
import type { Identity_EntitlementGrant } from 'src/__generated__/oigql/graphql';
import { Sandbox } from 'src/js/common/sandbox';

export interface QualtricsUserRole {
  roleId: string;
  roleType?: string;
  name?: string;
}

export interface QualtricsActiveEmployer {
  employerId?: string;
  product?: string;
  companyName?: string;
  employerName?: string;
  country?: string;
  userRoles?: QualtricsUserRole[];
  entitlementGrants?: Identity_EntitlementGrant[];
}

interface QualtricsSurveyWidgetProps {
  sandbox: Sandbox;
  featureTag: string;
  registerLoadSurvey: (loadSurvey: () => Promise<void>) => void;
  activeEmployer?: QualtricsActiveEmployer;
}

/**
 * QualtricsSurveyWidget - Wrapper component for HCM Qualtrics Survey widget
 *
 * This component loads the employee-management-ui/hcmQualtricsSurvey widget
 * and provides programmatic access to trigger surveys via the loadSurvey function.
 *
 * Usage:
 * ```tsx
 * const loadQualtricsRef = useRef<(() => Promise<void>) | null>(null);
 *
 * <QualtricsSurveyWidget
 *   sandbox={sandbox}
 *   featureTag="wfs-wfweb-sta"
 *   registerLoadSurvey={(loadSurvey) => {
 *     loadQualtricsRef.current = loadSurvey;
 *   }}
 * />
 *
 * // Later, trigger the survey:
 * loadQualtricsRef.current?.();
 * ```
 */
export default function QualtricsSurveyWidget({
  sandbox,
  featureTag,
  registerLoadSurvey,
  activeEmployer,
}: QualtricsSurveyWidgetProps): JSX.Element {
  return (
    <Widget
      widgetId="employee-management-ui/hcmQualtricsSurvey"
      sandbox={sandbox}
      featureTag={featureTag}
      registerLoadSurvey={registerLoadSurvey}
      activeEmployer={activeEmployer}
    />
  );
}
