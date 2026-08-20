import { useCallback } from 'react';
import { useSandbox, useTracking } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

export interface PopoverInstrumentationConfig {
  // DOMAIN
  org?: string;
  purpose?: string;
  scope?: string;
  scope_area?: string;

  // WHERE
  screen: string;

  // WHAT (LOGICAL)
  action?: string;
  object?: string;
  object_detail?: string;

  // WHAT (UI)
  ui_action?: string;
  ui_object?: string;
  ui_object_detail?: string;
  ui_access_point?: string;

  // WHERE (previous screen)
  previous_screen?: string;

  // Additional context
  popoverHeading?: string;
  additionalContext?: Record<string, any>;
}

export interface PopoverInstrumentationEvents {
  OPEN: TrackingPoint;
  CLOSE: TrackingPoint;
  SAVE?: TrackingPoint;
  CANCEL?: TrackingPoint;
  STEP_CHANGE?: TrackingPoint;
  TOUR_COMPLETE?: TrackingPoint;
  ERROR?: TrackingPoint;
}

export const createPopoverTrackingPoints = (
  config: PopoverInstrumentationConfig,
  isWorkforce: boolean,
): PopoverInstrumentationEvents => {
  const objectName = config.object || 'popover';
  const basePoint = {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: isWorkforce ? 'workforce' : 'qbo',
    screen: config.screen || 'unknown-screen',
    action: 'navigated',
    object: 'component',
    ui_action: 'clicked',
    ui_object: 'page',
    ui_access_point: config.ui_access_point || 'popover',
    ...(config.previous_screen && { previous_screen: config.previous_screen }),
    ...config.additionalContext,
  };

  return {
    OPEN: {
      ...basePoint,
      object_detail: config.object_detail || `${objectName}_opened`,
      ui_object_detail: config.ui_object_detail || `${objectName}_popover`,
    },
    CLOSE: {
      ...basePoint,
      object_detail: config.object_detail || `${objectName}_closed`,
      ui_object_detail: config.ui_object_detail || `${objectName}_popover`,
    },
    SAVE: {
      ...basePoint,
      object_detail: config.object_detail || `${objectName}_saved`,
      ui_object_detail: config.ui_object_detail || `${objectName}_save_button`,
    },
    CANCEL: {
      ...basePoint,
      object_detail: config.object_detail || `${objectName}_cancelled`,
      ui_object_detail:
        config.ui_object_detail || `${objectName}_cancel_button`,
    },
    STEP_CHANGE: {
      ...basePoint,
      object_detail: config.object_detail || `${objectName}_step_changed`,
      ui_object_detail: config.ui_object_detail || `${objectName}_tour_step`,
    },
    TOUR_COMPLETE: {
      ...basePoint,
      object_detail: config.object_detail || `${objectName}_tour_completed`,
      ui_object_detail: config.ui_object_detail || `${objectName}_tour`,
    },
    ERROR: {
      ...basePoint,
      action: 'error',
      object_detail: config.object_detail || `${objectName}_error`,
      ui_action: 'error',
      ui_object_detail: config.ui_object_detail || `${objectName}_popover`,
    },
  };
};

export const usePopoverInstrumentation = (
  config: PopoverInstrumentationConfig,
) => {
  const sandbox = useSandbox();
  const isWorkforce = isWorkforceEnvironment(sandbox);
  const track = useTracking();
  const trackingPoints = createPopoverTrackingPoints(config, isWorkforce);
  const objectName = config.object || 'popover';

  const logPopoverOpen = useCallback(
    (additionalData?: Record<string, any>) => {
      const objectName = config.object || 'popover';
      const componentName = config.object_detail || config.screen || objectName;
      // Use additionalData.popoverHeading first, then fallback to config.popoverHeading
      const dynamicHeading = additionalData?.popoverHeading;
      const configHeading = config.popoverHeading;
      const fallbackHeading = objectName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const heading = dynamicHeading || configHeading || fallbackHeading;

      sandbox.logger.info(
        `Component=${componentName} Event=Opened PopoverHeading=${heading}`,
        {
          // Component identification
          componentName,
          popoverHeading: heading,

          // Configuration details
          screen: config.screen || 'unknown-screen',
          object_detail: config.object_detail || 'unknown-object',
          ui_object_detail: config.ui_object_detail || 'unknown-ui-object',
          ui_access_point: config.ui_access_point || 'popover',
          ...(config.previous_screen && {
            previous_screen: config.previous_screen,
          }),

          // Additional context from config
          ...config.additionalContext,

          // Additional data from function call
          ...additionalData,
        },
      );

      // Pass dynamic data to tracking
      track({
        ...trackingPoints.OPEN,
        ...config.additionalContext,
        ...additionalData,
      });
    },
    [sandbox.logger, track, trackingPoints.OPEN, config],
  );

  const logPopoverClose = useCallback(
    (additionalData?: Record<string, any>) => {
      const objectName = config.object || 'popover';
      const componentName = config.object_detail || config.screen || objectName;
      // Use additionalData.popoverHeading first, then fallback to config.popoverHeading
      const dynamicHeading = additionalData?.popoverHeading;
      const configHeading = config.popoverHeading;
      const fallbackHeading = objectName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const heading = dynamicHeading || configHeading || fallbackHeading;

      sandbox.logger.info(
        `Component=${componentName} Event=Closed PopoverHeading=${heading}`,
        {
          // Component identification
          componentName,
          popoverHeading: heading,

          // Configuration details
          screen: config.screen || 'unknown-screen',
          object_detail: config.object_detail || 'unknown-object',
          ui_object_detail: config.ui_object_detail || 'unknown-ui-object',
          ui_access_point: config.ui_access_point || 'popover',
          ...(config.previous_screen && {
            previous_screen: config.previous_screen,
          }),

          // Additional context from config
          ...config.additionalContext,

          // Additional data from function call
          ...additionalData,
        },
      );

      // Pass dynamic data to tracking
      track({
        ...trackingPoints.CLOSE,
        ...config.additionalContext,
        ...additionalData,
      });
    },
    [sandbox.logger, track, trackingPoints.CLOSE, config],
  );

  const logPopoverSave = useCallback(
    (additionalData?: Record<string, any>) => {
      const componentName = config.object_detail || config.screen || objectName;
      // Use additionalData.popoverHeading first, then fallback to config.popoverHeading
      const dynamicHeading = additionalData?.popoverHeading;
      const configHeading = config.popoverHeading;
      const fallbackHeading = objectName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const heading = dynamicHeading || configHeading || fallbackHeading;

      sandbox.logger.info(
        `Component=${componentName} Event=Saved PopoverHeading=${heading}`,
        {
          // Component identification
          componentName,
          popoverHeading: heading,

          // Configuration details
          screen: config.screen || 'unknown-screen',
          object_detail: config.object_detail || 'unknown-object',
          ui_object_detail: config.ui_object_detail || 'unknown-ui-object',
          ui_access_point: config.ui_access_point || 'popover',
          ...(config.previous_screen && {
            previous_screen: config.previous_screen,
          }),

          // Additional context from config
          ...config.additionalContext,

          // Additional data from function call
          ...additionalData,
        },
      );

      // Pass dynamic data to tracking
      if (trackingPoints.SAVE) {
        track({
          ...trackingPoints.SAVE,
          ...config.additionalContext,
          ...additionalData,
        });
      }
    },
    [sandbox.logger, track, trackingPoints.SAVE, config, objectName],
  );

  const logPopoverCancel = useCallback(
    (additionalData?: Record<string, any>) => {
      const componentName = config.object_detail || config.screen || objectName;
      // Use additionalData.popoverHeading first, then fallback to config.popoverHeading
      const dynamicHeading = additionalData?.popoverHeading;
      const configHeading = config.popoverHeading;
      const fallbackHeading = objectName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const heading = dynamicHeading || configHeading || fallbackHeading;

      sandbox.logger.info(
        `Component=${componentName} Event=Cancelled PopoverHeading=${heading}`,
        {
          // Component identification
          componentName,
          popoverHeading: heading,

          // Configuration details
          screen: config.screen || 'unknown-screen',
          object_detail: config.object_detail || 'unknown-object',
          ui_object_detail: config.ui_object_detail || 'unknown-ui-object',
          ui_access_point: config.ui_access_point || 'popover',
          ...(config.previous_screen && {
            previous_screen: config.previous_screen,
          }),

          // Additional context from config
          ...config.additionalContext,

          // Additional data from function call
          ...additionalData,
        },
      );

      // Pass dynamic data to tracking
      if (trackingPoints.CANCEL) {
        track({
          ...trackingPoints.CANCEL,
          ...config.additionalContext,
          ...additionalData,
        });
      }
    },
    [sandbox.logger, track, trackingPoints.CANCEL, config, objectName],
  );

  const logTourStepChange = useCallback(
    (
      stepNumber: number,
      totalSteps: number,
      additionalData?: Record<string, any>,
    ) => {
      const componentName = config.object_detail || config.screen || objectName;
      // Use additionalData.popoverHeading first, then fallback to config.popoverHeading
      const dynamicHeading = additionalData?.popoverHeading;
      const configHeading = config.popoverHeading;
      const fallbackHeading = objectName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const heading = dynamicHeading || configHeading || fallbackHeading;

      sandbox.logger.info(
        `Component=${componentName} Event=StepChanged PopoverHeading=${heading}`,
        {
          // Component identification
          componentName,
          popoverHeading: heading,

          // Tour step details
          stepNumber: stepNumber.toString(),
          totalSteps: totalSteps.toString(),
          currentStep: stepNumber,

          // Configuration details
          screen: config.screen || 'unknown-screen',
          object_detail: config.object_detail || 'unknown-object',
          ui_object_detail: config.ui_object_detail || 'unknown-ui-object',
          ui_access_point: config.ui_access_point || 'popover',
          ...(config.previous_screen && {
            previous_screen: config.previous_screen,
          }),

          // Additional context from config
          ...config.additionalContext,

          // Additional data from function call
          ...additionalData,
        },
      );

      // Pass dynamic data to tracking
      if (trackingPoints.STEP_CHANGE) {
        track({
          ...trackingPoints.STEP_CHANGE,
          stepNumber: stepNumber.toString(),
          totalSteps: totalSteps.toString(),
          ...config.additionalContext,
          ...additionalData,
        });
      }
    },
    [sandbox.logger, track, trackingPoints.STEP_CHANGE, config, objectName],
  );

  const logTourComplete = useCallback(
    (additionalData?: Record<string, any>) => {
      const componentName = config.object_detail || config.screen || objectName;
      // Use additionalData.popoverHeading first, then fallback to config.popoverHeading
      const dynamicHeading = additionalData?.popoverHeading;
      const configHeading = config.popoverHeading;
      const fallbackHeading = objectName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const heading = dynamicHeading || configHeading || fallbackHeading;

      sandbox.logger.info(
        `Component=${componentName} Event=TourCompleted PopoverHeading=${heading}`,
        {
          // Component identification
          componentName,
          popoverHeading: heading,

          // Tour completion details
          completionStatus: 'success',

          // Configuration details
          screen: config.screen || 'unknown-screen',
          object_detail: config.object_detail || 'unknown-object',
          ui_object_detail: config.ui_object_detail || 'unknown-ui-object',
          ui_access_point: config.ui_access_point || 'popover',
          ...(config.previous_screen && {
            previous_screen: config.previous_screen,
          }),

          // Additional context from config
          ...config.additionalContext,

          // Additional data from function call
          ...additionalData,
        },
      );

      // Pass dynamic data to tracking
      if (trackingPoints.TOUR_COMPLETE) {
        track({
          ...trackingPoints.TOUR_COMPLETE,
          ...config.additionalContext,
          ...additionalData,
        });
      }
    },
    [sandbox.logger, track, trackingPoints.TOUR_COMPLETE, config, objectName],
  );

  const logPopoverError = useCallback(
    (error: string, additionalData?: Record<string, any>) => {
      const componentName = config.object_detail || config.screen || objectName;
      // Use additionalData.popoverHeading first, then fallback to config.popoverHeading
      const dynamicHeading = additionalData?.popoverHeading;
      const configHeading = config.popoverHeading;
      const fallbackHeading = objectName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const heading = dynamicHeading || configHeading || fallbackHeading;

      sandbox.logger.error(
        `Component=${componentName} Event=Error PopoverHeading=${heading} ErrorMessage=${error}`,
        {
          // Component identification
          componentName,
          popoverHeading: heading,

          // Error details
          errorMessage: error,
          errorType: 'popover_error',

          // Configuration details
          screen: config.screen || 'unknown-screen',
          object_detail: config.object_detail || 'unknown-object',
          ui_object_detail: config.ui_object_detail || 'unknown-ui-object',
          ui_access_point: config.ui_access_point || 'popover',
          ...(config.previous_screen && {
            previous_screen: config.previous_screen,
          }),

          // Additional context from config
          ...config.additionalContext,

          // Additional data from function call
          ...additionalData,
        },
      );

      // Pass dynamic data to tracking
      if (trackingPoints.ERROR) {
        track({
          ...trackingPoints.ERROR,
          errorMessage: error,
          ...config.additionalContext,
          ...additionalData,
        });
      }
    },
    [sandbox.logger, track, trackingPoints.ERROR, config, objectName],
  );

  return {
    trackingPoints,
    logPopoverOpen,
    logPopoverClose,
    logPopoverSave,
    logPopoverCancel,
    logTourStepChange,
    logTourComplete,
    logPopoverError,
  };
};
