import React, { useCallback } from 'react';
import { B2, B3 } from '@ids-ts/typography';
import { Checkbox } from '@ids-ts/checkbox';
import { Dropdown, MenuItem } from '@ids-ts/dropdown';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@ids-ts/table';
import { Settings } from '@design-systems/icons';
import { useSelector } from 'react-redux';
import {
  CardContainer,
  CardHeader,
  IconCircle,
  InnerCardContainer,
} from '../base.styles';
import { useCustomFieldsData } from '../hooks/useCustomFieldsData';
import { selectQBTimeFields } from '../store/selectors';

interface MappedColumnsSectionProps {
  mappedColumns: string[];
  columnMappings: Record<string, string>;
  mappingCheckboxes: Record<string, boolean>;
  unknownMappings: Record<string, string>;
  onMappingChange: (column: string, mapping: string) => void;
  onCheckboxChange: (column: string, checked: boolean) => void;
}

const MappedColumnsSection: React.FC<MappedColumnsSectionProps> = ({
  mappedColumns,
  columnMappings,
  mappingCheckboxes,
  unknownMappings,
  onMappingChange,
  onCheckboxChange,
}) => {
  const { customFields } = useCustomFieldsData();
  const qbTimeFields = useSelector(selectQBTimeFields);

  // Add custom fields to QBTime columns
  const allQbTimeColumns = [
    ...qbTimeFields,
    ...customFields.map((field) => field.name),
  ];

  const handleMappingChange = useCallback(
    (column: string) => (e: any) => {
      onMappingChange(column, e.target.value);
    },
    [onMappingChange],
  );

  const handleCheckboxChange = useCallback(
    (column: string) => (e: any) => {
      onCheckboxChange(column, e.target.checked);
    },
    [onCheckboxChange],
  );

  return (
    <CardContainer>
      <InnerCardContainer>
        <CardHeader>
          <IconCircle>
            <Settings size="small" color="white" />
          </IconCircle>
          <B2 weight="demi" style={{ color: '#000' }}>
            Mapped Columns
          </B2>
        </CardHeader>

        <Table divider="horizontal">
          <TableHeader>
            <TableRow>
              <TableCell>Include</TableCell>
              <TableCell>Excel Column</TableCell>
              <TableCell>QBTime Field</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappedColumns.map((column) => {
              const mappedField = columnMappings[column];
              const isUnchecked = !mappingCheckboxes[column];

              return (
                <TableRow
                  key={`mapped-${column}-${mappedField || 'unmapped'}`}
                  style={{
                    backgroundColor: isUnchecked ? '#fff3cd' : 'transparent',
                    borderLeft: isUnchecked ? '4px solid #ffc107' : 'none',
                  }}
                >
                  <TableCell>
                    <Checkbox
                      checked={mappingCheckboxes[column] || false}
                      onChange={handleCheckboxChange(column)}
                    />
                  </TableCell>
                  <TableCell>
                    <B3 style={{ color: '#000' }}>{column}</B3>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Dropdown
                        value={columnMappings[column] || ''}
                        onChange={handleMappingChange(column)}
                        label=""
                        placeholder="Select QBTime field"
                        width="100%"
                      >
                        {allQbTimeColumns.map((col) => {
                          const isUsedInMapped =
                            Object.values(columnMappings).includes(col) &&
                            columnMappings[column] !== col;
                          const isUsedInUnknown =
                            Object.values(unknownMappings).includes(col);
                          const isUsed = isUsedInMapped || isUsedInUnknown;

                          // Check for time field conflicts
                          const hasStartTime =
                            Object.values(columnMappings).includes(
                              'start time',
                            );
                          const hasEndTime =
                            Object.values(columnMappings).includes('end time');
                          const hasHours =
                            Object.values(columnMappings).includes('hours') ||
                            Object.values(columnMappings).includes('duration');

                          let isDisabled = isUsed;
                          let conflictReason = '';

                          // Disable hours/duration if start/end time are mapped
                          if (
                            (col === 'hours' || col === 'duration') &&
                            (hasStartTime || hasEndTime)
                          ) {
                            isDisabled = true;
                            conflictReason = '(start/end time mapped)';
                          }

                          // Disable start/end time if hours/duration is mapped
                          if (
                            (col === 'start time' || col === 'end time') &&
                            hasHours
                          ) {
                            isDisabled = true;
                            conflictReason = '(hours mapped)';
                          }

                          return (
                            <MenuItem
                              key={col}
                              value={col}
                              disabled={isDisabled}
                            >
                              {col} {isUsed ? '(used)' : ''} {conflictReason}
                            </MenuItem>
                          );
                        })}
                      </Dropdown>
                      {isUnchecked && (
                        <B3
                          style={{
                            color: '#856404',
                            fontSize: '12px',
                            marginTop: '4px',
                          }}
                        >
                          ⚠ Will move to unknown columns
                        </B3>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </InnerCardContainer>
    </CardContainer>
  );
};

export default MappedColumnsSection;
