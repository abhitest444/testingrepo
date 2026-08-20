import React from 'react';
import HOCWidget from 'web-shell-core/widgets/HOCWidget';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { getCustomFields } from 'src/js/common/UserVoiceUtils';

export interface UserVoiceFeedbackWidgetProps {
  renderFeedbackTrigger: (
    handleAccessPointClick: () => void,
  ) => React.ReactNode;
  widgetIdentifier?: string | null;
  isOvertimeEnabled?: boolean;
}

export default function UserVoiceFeedBackWidget({
  renderFeedbackTrigger,
  widgetIdentifier,
  isOvertimeEnabled = false,
}: UserVoiceFeedbackWidgetProps): JSX.Element {
  const intl = useIntl();
  const sandbox = useSandbox();

  // Reuse the existing getCustomFields function from UserVoiceUtils
  const getCustomFieldsData = () => {
    const realmInfo = sandbox.appContext.getRealmInfo();
    const authInfo = sandbox.extensions.qbo.context.getAuthInfo();

    const realmName = realmInfo?.realmName || '';
    const isAccountantUser = authInfo?.isAccountantUser || false;
    const isAdmin = authInfo?.isAdmin || false;
    const isMasterAdmin = authInfo?.isMasterAdmin || false;
    const roleType = authInfo?.legacyRoles?.roleType || '';
    const authId = sandbox.appContext.getUserAuthInfo()?.authId || '';

    return getCustomFields({
      widgetId: widgetIdentifier || sandbox.sandboxContext.getInfo().widgetId,
      realmName,
      isAccountantUser,
      isAdmin,
      isMasterAdmin,
      roleType,
      authId,
      isOvertimeEnabled,
    });
  };

  return (
    <HOCWidget
      widgetId="css-uservoice-ui/feedback"
      queue="time"
      sandbox={sandbox}
      position="automatic"
      contactTitle={intl.formatMessage({
        id: 'feedback_title',
      })}
      contactMessagePlaceholder={intl.formatMessage({
        id: 'feedback_placeholder',
      })}
      contactSubmitButtonText={intl.formatMessage({
        id: 'submit',
      })}
      contactSuccessTitle={intl.formatMessage({
        id: 'feedback_success_title',
      })}
      contactSuccessBody={intl.formatMessage({
        id: 'feedback_success_body',
      })}
      customFields={getCustomFieldsData()}
      enableScreenshotCapturing={false}
    >
      {renderFeedbackTrigger}
    </HOCWidget>
  );
}
