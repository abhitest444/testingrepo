import React, { useMemo } from 'react';
import { useIntl } from '@payroll/quicksand';
import { Table } from '@ids-ts/table';
import { B3 } from '@ids-ts/typography';
import Accordion, {
  AccordionItem,
  AccordionItemBody,
  AccordionItemHeader,
} from '@ids-ts/accordion';
import { WhoIsWorkingWorkerNode } from '../../hooks/useWhoIsWorkingLoadMore';
import { GroupContent } from './WorkerListGrouped.styled';
import { StyledTable } from './WorkerList.styled';
import { WorkerRowContent } from './WorkerRowContent';

interface WorkerListGroupedProps {
  workers: WhoIsWorkingWorkerNode[];
  selectedWorkerId?: string;
  onMapClick: (workerId: string, event: React.MouseEvent) => void;
  onEditTime: (timeEntryId: string) => void;
  onAddTime: () => void;
  onAddBreak: (workerId: string) => void;
  currentUserWorkerId?: string;
  isWhoIsWorkingEditTimeEnabled?: boolean;
}

interface GroupedWorkers {
  groupId: string;
  groupName: string;
  workers: WhoIsWorkingWorkerNode[];
}

const NO_GROUP_ID = 'no-group';

/**
 * WorkerListGrouped Component
 * Renders workers grouped by their group name using IDS Accordion
 * Groups are expanded by default
 */
export const WorkerListGrouped: React.FC<WorkerListGroupedProps> = ({
  workers,
  selectedWorkerId = '',
  onMapClick,
  onEditTime,
  onAddTime,
  onAddBreak,
  currentUserWorkerId,
  isWhoIsWorkingEditTimeEnabled = true,
}) => {
  const intl = useIntl();
  const noGroupName = intl.formatMessage({
    id: 'whosWorking.group.noGroup',
  });

  // Group workers by group name - maintains insertion order for pagination support
  const groupedWorkers = useMemo((): GroupedWorkers[] => {
    const groupMap = new Map<string, GroupedWorkers>();

    workers.forEach((worker) => {
      const groupId = worker.group?.groupId || NO_GROUP_ID;
      const groupName = worker.group?.groupName || noGroupName;

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          groupId,
          groupName,
          workers: [],
        });
      }
      groupMap.get(groupId)!.workers.push(worker);
    });

    // Convert to array - Map maintains insertion order so groups appear
    // in the order they were first encountered during pagination
    return Array.from(groupMap.values());
  }, [workers, noGroupName]);

  const getGroupTitle = (group: GroupedWorkers): string =>
    `${group.groupName} (${group.workers.length})`;

  return (
    <>
      {/* Header row above accordion */}
      <StyledTable
        divider="horizontal"
        summary="Group list header"
        density="roomy"
      >
        <Table.Header>
          <Table.Row>
            <Table.Cell>
              <B3 weight="demi">
                {intl.formatMessage({
                  id: 'whosWorking.list.header.group',
                })}
              </B3>
            </Table.Cell>
            <Table.Cell>
              <B3 weight="demi">
                {intl.formatMessage({
                  id: 'whosWorking.list.header.hours',
                })}
              </B3>
            </Table.Cell>
            <Table.Cell>
              <B3 weight="demi">
                {intl.formatMessage({
                  id: 'whosWorking.list.header.map',
                })}
              </B3>
            </Table.Cell>
            <Table.Cell>
              <B3 weight="demi">
                {intl.formatMessage({
                  id: 'whosWorking.list.header.action',
                })}
              </B3>
            </Table.Cell>
          </Table.Row>
        </Table.Header>
      </StyledTable>

      <Accordion
        allowMultipleExpanded
        allowZeroExpanded
        size="medium"
        variant="standard"
      >
        {groupedWorkers.map((group, index) => (
          <AccordionItem
            key={group.groupId}
            id={group.groupId}
            index={index}
            defaultExpanded
          >
            <AccordionItemHeader
              sectionTitle={getGroupTitle(group)}
              className="accordion-item-header"
            />
            <AccordionItemBody className="accordion-item-body">
              <GroupContent>
                <StyledTable
                  divider="horizontal"
                  hover="row"
                  summary={`Workers in ${group.groupName}`}
                  density="roomy"
                >
                  <Table.Body>
                    {group.workers.map((worker) => {
                      const workerId = worker.timeForContactDAS?.id || '';
                      const isSelected = workerId === selectedWorkerId;

                      return (
                        <WorkerRowContent
                          key={workerId || worker.displayName}
                          worker={worker}
                          isSelected={isSelected}
                          onMapClick={onMapClick}
                          onEditTime={onEditTime}
                          onAddTime={onAddTime}
                          onAddBreak={() => onAddBreak(workerId)}
                          currentUserWorkerId={currentUserWorkerId}
                          isWhoIsWorkingEditTimeEnabled={
                            isWhoIsWorkingEditTimeEnabled
                          }
                        />
                      );
                    })}
                  </Table.Body>
                </StyledTable>
              </GroupContent>
            </AccordionItemBody>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
};
