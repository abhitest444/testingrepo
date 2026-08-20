import React, { useState } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import Button from '@ids-ts/button';
import styled from 'styled-components';
import Trowser from '@ids-ts/trowser';
import Widget from 'web-shell-core/widgets/HOCWidget';
import ErrorBoundary from 'src/js/widgets/qbtOrchestrator/components/ErrorBoundary';
import { AuthErrorMessage } from 'src/js/widgets/common/AuthErrorMessage';

const StyledTrowser = styled(Trowser)`
  [class^='Trowser-sectionContent-'] {
    height: 100%;
  }
`;

/**
 * Renders a "Who's working" action button.
 * Clicking it opens the trowser that mounts the `time-tracking-ui/whosworking` widget,
 * The widget shows an overview of which workers are currently on the clock.
 */
export const WhosWorkingButton: React.FC = () => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const [isTrowserOpen, setIsTrowserOpen] = useState(false);

  const handleOpen = () => {
    sandbox.logger.info(
      'Component="WhosWorkingButton" Event="Who\'s working button clicked"',
    );
    setIsTrowserOpen(true);
  };

  const handleClose = () => {
    sandbox.logger.info(
      'Component="WhosWorkingButton" Event="Who\'s working trowser closed"',
    );
    setIsTrowserOpen(false);
  };

  const handleWidgetError = (error: Error | string) => {
    sandbox.logger.error(
      'Component="WhosWorkingButton" Error="WHOS_WORKING_WIDGET_CRASH"',
      { error },
    );
  };

  return (
    <>
      <Button
        purpose="standard"
        priority="secondary"
        onClick={handleOpen}
        aria-label={intl.formatMessage({
          id: 'workers.header.whosWorking.ariaLabel',
          defaultMessage: "View who's working",
        })}
        data-testid="whos-working-btn"
      >
        {intl.formatMessage({
          id: 'workers.header.whosWorking',
          defaultMessage: "Who's working",
        })}
      </Button>

      {/* Lazy-mount: defer loading the whosworking widget bundle until first open */}
      {isTrowserOpen && (
        <StyledTrowser
          dismissible
          showCancelFooterButton
          open
          onClose={handleClose}
          cancelFooterButtonLabel={intl.formatMessage({
            id: 'workers.header.whosWorking.close',
            defaultMessage: 'Close',
          })}
          title={intl.formatMessage({
            id: 'workers.header.whosWorking.trowserTitle',
            defaultMessage: "Who's working",
          })}
        >
          {/* ErrorBoundary catches render-phase throws and shows the fallback */}
          <ErrorBoundary
            logger={sandbox.logger}
            onError={handleWidgetError}
            fallback={<AuthErrorMessage />}
          >
            <Widget
              widgetId="time-tracking-ui/whosworking"
              sandbox={sandbox}
              onReady={() => {
                sandbox.logger.info(
                  'Component="WhosWorkingButton" Event="Who\'s working widget mounted"',
                );
              }}
              onError={handleWidgetError}
            />
          </ErrorBoundary>
        </StyledTrowser>
      )}
    </>
  );
};
