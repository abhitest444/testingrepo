import React from 'react';
import { useIntl } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';

import type { OvertimeRule } from '../../store/overtimeSlice';
import {
  RULE_TYPE_TO_LABEL_ID,
  getConditionValue,
} from './constants/overtimeRulesConstants';
import {
  ReviewRulesTableWrapper,
  ReviewRulesTable,
} from './styles/PolicySetupWizard.styled';

export interface OvertimeRulesTableProps {
  rules: OvertimeRule[];
}

const OvertimeRulesTable: React.FC<OvertimeRulesTableProps> = ({ rules }) => {
  const intl = useIntl();

  const formatThreshold = (rule: OvertimeRule): string => {
    const threshold = getConditionValue(rule, 'threshold');

    if (rule.type === 'consecutive_daily') {
      const daysInRow = getConditionValue(rule, 'days_in_a_row');
      if (!daysInRow || !threshold) return '—';
      return intl.formatMessage(
        {
          id: 'overtime.rules.table.threshold.consecutive_daily',
          defaultMessage: '{days} consecutive days — first {threshold} hrs',
        },
        { days: daysInRow, threshold },
      );
    }

    if (rule.type === 'consecutive_double_daily') {
      const daysInRow = getConditionValue(rule, 'days_in_a_row');
      if (!daysInRow || !threshold) return '—';
      return intl.formatMessage(
        {
          id: 'overtime.rules.table.threshold.consecutive_double_daily',
          defaultMessage: '{days} consecutive days — over {threshold} hrs',
        },
        { days: daysInRow, threshold },
      );
    }

    if (!threshold) return '—';

    const unit =
      rule.frequency === 'WEEKLY'
        ? intl.formatMessage({
            id: 'overtime.rules.table.unit.week',
            defaultMessage: 'hrs/week',
          })
        : intl.formatMessage({
            id: 'overtime.rules.table.unit.day',
            defaultMessage: 'hrs/day',
          });

    return `${threshold} ${unit}`;
  };

  const getRuleLabel = (rule: OvertimeRule): string => {
    const labelId = RULE_TYPE_TO_LABEL_ID[rule.type];
    if (!labelId) return rule.name;

    return intl.formatMessage({
      id: labelId,
      defaultMessage: rule.name,
    });
  };

  const getPayItemLabel = (rule: OvertimeRule): string => {
    if (
      rule.type === 'double_daily' ||
      rule.type === 'consecutive_double_daily'
    ) {
      return intl.formatMessage({
        id: 'overtime.rules.table.payitem.double_overtime',
        defaultMessage: 'Double overtime pay',
      });
    }
    return intl.formatMessage({
      id: 'overtime.rules.table.payitem.overtime',
      defaultMessage: 'Overtime pay',
    });
  };

  if (!rules || rules.length === 0) {
    return (
      <Typography variant="body-2" weight="regular">
        {intl.formatMessage({
          id: 'overtime.rules.table.empty',
          defaultMessage: 'No rules configured',
        })}
      </Typography>
    );
  }

  return (
    <ReviewRulesTableWrapper>
      <ReviewRulesTable>
        <thead>
          <tr>
            <th>
              {intl.formatMessage({
                id: 'overtime.rules.table.header.rule',
                defaultMessage: 'Rule',
              })}
            </th>
            <th>
              {intl.formatMessage({
                id: 'overtime.rules.table.header.payitem',
                defaultMessage: 'Pay item',
              })}
            </th>
            <th>
              {intl.formatMessage({
                id: 'overtime.rules.table.header.startsafter',
                defaultMessage: 'Starts after',
              })}
            </th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.type}>
              <td>{getRuleLabel(rule)}</td>
              <td>{getPayItemLabel(rule)}</td>
              <td>{formatThreshold(rule)}</td>
            </tr>
          ))}
        </tbody>
      </ReviewRulesTable>
    </ReviewRulesTableWrapper>
  );
};

export { OvertimeRulesTable };
export default OvertimeRulesTable;
