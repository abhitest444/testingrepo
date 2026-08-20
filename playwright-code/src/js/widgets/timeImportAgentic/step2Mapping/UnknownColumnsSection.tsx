import React, { useCallback } from 'react';
import { B2, B3 } from '@ids-ts/typography';
import { Checkbox } from '@ids-ts/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@ids-ts/table';
import { CircleAlertQuickbooks } from '@design-systems/icons';
import {
  CardContainer,
  CardHeader,
  IconCircle,
  InnerCardContainer,
} from '../base.styles';

interface UnknownColumnsSectionProps {
  unknownColumns: string[];
  unknownCheckboxes: Record<string, boolean>;
  onUnknownCheckboxChange: (column: string, checked: boolean) => void;
}

const UnknownColumnsSection: React.FC<UnknownColumnsSectionProps> = ({
  unknownColumns,
  unknownCheckboxes,
  onUnknownCheckboxChange,
}) => {
  const handleUnknownCheckboxChange = useCallback(
    (column: string) => (e: any) => {
      onUnknownCheckboxChange(column, e.target.checked);
    },
    [onUnknownCheckboxChange],
  );

  return (
    <CardContainer>
      <InnerCardContainer>
        <CardHeader>
          <IconCircle>
            <CircleAlertQuickbooks size="small" color="white" />
          </IconCircle>
          <B2 weight="demi" style={{ color: '#000' }}>
            Unknown Columns
          </B2>
        </CardHeader>

        <Table divider="horizontal">
          <TableHeader>
            <TableRow>
              <TableCell>Include</TableCell>
              <TableCell>Excel Column</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unknownColumns.map((column) => (
              <TableRow
                key={`unknown-${column}-${
                  unknownCheckboxes[column] ? 'checked' : 'unchecked'
                }`}
              >
                <TableCell>
                  <Checkbox
                    checked={unknownCheckboxes[column] || false}
                    onChange={handleUnknownCheckboxChange(column)}
                  />
                </TableCell>
                <TableCell>
                  <B3 style={{ color: '#000' }}>{column}</B3>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </InnerCardContainer>
    </CardContainer>
  );
};

export default UnknownColumnsSection;
