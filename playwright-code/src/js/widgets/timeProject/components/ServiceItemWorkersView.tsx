import React, { useEffect } from 'react';
import { B3 } from '@ids-ts/typography';
import { useIntl } from '@payroll/quicksand';
import styled from 'styled-components';
import { useWorkerTimeSummary } from '../hooks/useWorkerTimeSummary';
import WorkerTable from './WorkerTable';

export interface ServiceItemWorkersViewProps {
  projectId: string;
  // Required: the contacts-resolved customer id for this project (see
  // `useProjectCustomerLookup`). Paired with `projectId` on the
  // worker-summary read so the supergraph can scope to the (project,
  // customer) tuple per the new contract. Tolerated as empty so legacy
  // / test renders that haven't migrated yet still type-check.
  customerId: string;
  workerId?: string | null;
  serviceItemId: string;
  serviceItemName: string;
  onBack: () => void;
}

const Container = styled.div`
  padding: 0;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: 16px;
  color: #0077c5;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

const ServiceItemWorkersView: React.FC<ServiceItemWorkersViewProps> = ({
  projectId,
  customerId,
  workerId,
  serviceItemId,
  serviceItemName,
  onBack,
}) => {
  const intl = useIntl();
  const {
    workers,
    loading,
    page,
    totalPages,
    fetchWorkerSummary,
    goToNextPage,
    goToPrevPage,
  } = useWorkerTimeSummary(workerId);

  useEffect(() => {
    fetchWorkerSummary({ projectId, customerId, serviceItemId });
  }, [fetchWorkerSummary, projectId, customerId, serviceItemId]);

  return (
    <Container data-testid="service-item-workers-view">
      <BackButton onClick={onBack} data-testid="service-item-workers-back">
        <B3>
          ←{' '}
          {intl.formatMessage(
            { id: 'timeProject.summary.serviceItemWorkers.backTo' },
            { name: serviceItemName },
          )}
        </B3>
      </BackButton>
      <WorkerTable
        workers={workers}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onNextPage={goToNextPage}
        onPrevPage={goToPrevPage}
      />
    </Container>
  );
};

export default ServiceItemWorkersView;
