import React, { lazy } from 'react';
import { FEATURE_NAMES } from '../constants';

const OvertimeFeature = lazy(() => import('../features/overtime'));
const ApprovalsFeature = lazy(() => import('../features/approvals'));
const WorkersFeature = lazy(() => import('../features/workers'));
const TimeKioskFeature = lazy(() => import('../features/timeKiosk'));

interface FeatureRouterProps {
  feature: string;
  [key: string]: any;
}

/**
 * Feature Router - Routes to different features based on options
 * Add new features here as they are implemented
 */
const FeatureRouter: React.FC<FeatureRouterProps> = ({ feature, ...props }) => {
  switch (feature) {
    case FEATURE_NAMES.OVERTIME:
      return <OvertimeFeature {...props} />;
    case FEATURE_NAMES.APPROVALS:
      return <ApprovalsFeature {...props} />;
    case FEATURE_NAMES.WORKERS:
      return <WorkersFeature {...props} />;
    case FEATURE_NAMES.TIME_KIOSK:
      return <TimeKioskFeature {...props} />;
    default:
      return <div>Unknown feature: {feature}</div>;
  }
};

export default FeatureRouter;
