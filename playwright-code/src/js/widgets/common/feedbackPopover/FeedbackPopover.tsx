import React from 'react';

import {
  Popover,
  PopoverActions,
  PopoverHeader,
  PopoverContent,
} from '@ids-ts/popover';
import { Button } from '@ids-ts/button';
import TextArea from '@ids-ts/textarea';
import { B3 } from '@ids-ts/typography';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { Activity } from '@ids-ts/loader';

import { postToUserVoice } from 'src/js/common/UserVoiceUtils';

import './FeedbackPopover.css';
import { getFlavor } from '../../../common/MiscUtils';

export interface FeedbackPopoverProps {
  open: boolean;
  onClose: (result: { success: boolean } | null) => void;
  targetElement: HTMLElement;
  widgetIdentifier?: string | null;
  isOvertimeEnabled?: boolean;
  isGeofenceEnabled?: boolean;
}

export default function FeedbackPopover({
  open,
  onClose,
  targetElement,
  widgetIdentifier,
  isOvertimeEnabled = false,
  isGeofenceEnabled = false,
}: FeedbackPopoverProps): JSX.Element {
  const [feedback, setFeedback] = React.useState<string>('');
  const [feedbackErrorMessage, setFeedbackErrorMessage] =
    React.useState<string>('');
  const [sendingFeedback, setSendingFeedback] = React.useState<boolean>(false);
  const intl = useIntl();
  const sandbox = useSandbox();

  const handleFeedbackOnChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setFeedback(e.target.value);
  };

  const handleOnClose = () => {
    onClose(null);
  };

  const handleSendFeedbackClick = () => {
    if (!feedback) {
      setFeedbackErrorMessage(
        intl.formatMessage({ id: 'feedback.popover.error' }),
      );
    } else {
      setFeedbackErrorMessage('');
      setSendingFeedback(true);
      postToUserVoice(
        {
          message: feedback.trimStart().trimEnd(),
          qboFlavor: getFlavor(),
        },
        sandbox,
        widgetIdentifier,
        isOvertimeEnabled,
        isGeofenceEnabled,
      ).finally(() => {
        setSendingFeedback(false);
        onClose({ success: true });
      });
    }
  };

  const renderPopoverHeader = () => {
    if (sendingFeedback) {
      return <></>;
    }

    return (
      <PopoverHeader
        title={intl.formatMessage({ id: 'feedback.popover.title' })}
      />
    );
  };

  const renderPopoverContent = () => {
    if (sendingFeedback) {
      return (
        <PopoverContent>
          <div data-testId="activity-wrapper" className="activity-wrapper">
            <Activity shape="dots" size="large" />
          </div>
        </PopoverContent>
      );
    }

    return (
      <PopoverContent>
        <div className="popover-content-wrapper">
          <B3 as="div">
            {intl.formatMessage({ id: 'feedback.popover.body' })}
          </B3>
          <TextArea
            aria-label={intl.formatMessage({
              id: 'feedback.popover.aria.label',
            })}
            width="100%"
            value={feedback}
            onChange={handleFeedbackOnChange}
            required
            errorText={feedbackErrorMessage}
            resizeTextArea={false}
          />
        </div>
      </PopoverContent>
    );
  };

  const renderPopoverActions = () => {
    if (sendingFeedback) {
      return <></>;
    }

    return (
      <PopoverActions>
        <Button priority="primary" onClick={handleSendFeedbackClick}>
          {intl.formatMessage({ id: 'feedback.popover.button.label' })}
        </Button>
      </PopoverActions>
    );
  };

  return (
    <Popover
      dismissible
      enableClickAway
      open={open}
      onClose={handleOnClose}
      targetElement={targetElement}
      position="bottom"
      alignment="left"
      variant="popover"
    >
      {renderPopoverHeader()}
      {renderPopoverContent()}
      {renderPopoverActions()}
    </Popover>
  );
}
