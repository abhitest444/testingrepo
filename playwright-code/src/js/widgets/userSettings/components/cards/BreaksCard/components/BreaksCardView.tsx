import React from 'react';
import { B2, B4, Demi, B1, Medium } from '@ids-ts/typography';
import { IconControl } from '@ids-ts/icon-control';
import { NewWindow, CoffeeMug, ThumbDown } from '@design-systems/icons';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { Skeleton } from '@cgds/skeleton';
import { BreakRule } from 'src/js/service/hooks/breaks';
import {
  HeaderRow,
  Actions,
} from 'src/js/widgets/userSettings/components/styles/cards.styles';
import { useAppSelector } from '../../../../store';
import {
  selectPaidBreaks,
  selectUnpaidBreaks,
  selectBreaksLoading,
  selectBreaksError,
} from '../../../../store/slices/breaksSlice';
import { NAVIGATION_ROUTES } from '../../../constants/UserSettingsPage.constants';
import { BreaksGrid, BreaksColumn, BreakRuleItem } from '../styles';
import BreaksStateMessage from './BreaksStateMessage';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <B4 style={{ color: '#6b7177' }}>
    <Demi>{children}</Demi>
  </B4>
);

interface BreaksColumnContentProps {
  label: string;
  loading: boolean;
  breakRules: BreakRule[];
}

const BreaksColumnContent: React.FC<BreaksColumnContentProps> = ({
  label,
  loading,
  breakRules,
}) => (
  <>
    <Label>{label}</Label>
    {loading && (
      <>
        <Skeleton variant="rectangular" height={18} />
        <Skeleton variant="rectangular" height={18} />
      </>
    )}
    {!loading && breakRules.length === 0 && (
      <B2>
        <Medium>—</Medium>
      </B2>
    )}
    {!loading &&
      breakRules.length > 0 &&
      breakRules.map((rule: BreakRule) => (
        <BreakRuleItem key={rule.id}>
          <B2>
            <Medium>{rule.breakName}</Medium>
          </B2>
        </BreakRuleItem>
      ))}
  </>
);

const BreaksCardView: React.FC = () => {
  const intl = useIntl();
  const sandbox = useSandbox();

  // Get breaks from Redux store, already filtered by paid/unpaid
  const paidBreakRules = useAppSelector(selectPaidBreaks);
  const unpaidBreakRules = useAppSelector(selectUnpaidBreaks);
  const loading = useAppSelector(selectBreaksLoading);
  const error = useAppSelector(selectBreaksError);

  // Check if there are no break rules at all
  const hasNoBreakRules =
    !loading && paidBreakRules.length + unpaidBreakRules.length === 0;

  // Navigate to Time Tracking Settings page to manage breaks
  const handleEditBreaksClick = () => {
    try {
      sandbox.navigation.navigate(NAVIGATION_ROUTES.TIME_SETTINGS);
      sandbox.logger.info(
        'Component=BreaksCardView Event=Navigating to time settings',
      );
    } catch (err) {
      sandbox.logger.error(
        'Component=BreaksCardView Event=Navigation to time settings failed',
        {
          error: err,
        },
      );
    }
  };

  // Render header
  const renderHeader = () => (
    <HeaderRow>
      <B1>
        <Medium>{intl.formatMessage({ id: 'breaks.title' })}</Medium>
      </B1>
      <Actions>
        <IconControl
          disabled={loading}
          onClick={handleEditBreaksClick}
          aria-label="edit-breaks"
        >
          <NewWindow />
        </IconControl>
      </Actions>
    </HeaderRow>
  );

  // When Breaks API call fails and we have no data - return early with error state
  if (error) {
    return (
      <div>
        {renderHeader()}
        <BreaksStateMessage
          icon={ThumbDown}
          messageId="breaks.card.error.state.message"
          testId="breaks-error-state"
        />
      </div>
    );
  }

  return (
    <>
      {renderHeader()}
      {hasNoBreakRules ? (
        <BreaksStateMessage
          icon={CoffeeMug}
          messageId="breaks.empty.state.message"
          testId="breaks-empty-state"
        />
      ) : (
        <BreaksGrid>
          <BreaksColumn>
            <BreaksColumnContent
              label={intl.formatMessage({ id: 'breaks.paid.rules' })}
              loading={loading}
              breakRules={paidBreakRules}
            />
          </BreaksColumn>

          <BreaksColumn>
            <BreaksColumnContent
              label={intl.formatMessage({ id: 'breaks.unpaid.rules' })}
              loading={loading}
              breakRules={unpaidBreakRules}
            />
          </BreaksColumn>
        </BreaksGrid>
      )}
    </>
  );
};

export default BreaksCardView;
