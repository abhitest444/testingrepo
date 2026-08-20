import { DecisionType } from '@appfabric/sandbox-spec';
import {
  buildSandbox,
  MockQuicksandProvider,
  useSandbox,
} from '@payroll/quicksand';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import React, { useEffect } from 'react';
import { act } from 'react-dom/test-utils';
import ADSProvider, { useADS } from 'src/js/providers/ADSProvider';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';

describe('ADS Provider test', () => {
  test('useGetADSDecision test', async () => {
    const sandbox = buildSandbox();
    jest.spyOn(sandbox.authorization, 'isAuthorizedBatch').mockResolvedValue([
      { decision: DecisionType.PERMIT, isAuthorized: true },
      { decision: DecisionType.DENY, isAuthorized: false },
    ]);

    const isAuthZSpy = jest
      .spyOn(sandbox.authorization, 'isAuthorized')
      .mockResolvedValue({
        decision: DecisionType.PERMIT,
        isAuthorized: true,
      });
    const { result } = renderHook(useADS, {
      wrapper: ({ children }) => (
        <MockQuicksandProvider>
          <ADSProvider>{children}</ADSProvider>
        </MockQuicksandProvider>
      ),
    });
    await result.current.getADSDecision(
      sandbox,
      { id: 'irn' },
      { id: 'create' },
      { id: 'subject' },
      { id: 'environment' },
    );
    await act(async () => {});
    await waitFor(() => {
      expect(result.current.decisionMap).toMatchObject({
        'id:irn|id:create|id:subject|id:environment': {
          isAuthorized: true,
          decision: 'PERMIT',
        },
      });
    });
    // refetching
    await act(async () => {
      await result.current.getADSDecision(
        sandbox,
        { id: 'irn' },
        { id: 'create' },
        { id: 'subject' },
        { id: 'environment' },
      );
    });

    await waitFor(() => {
      expect(result.current.decisionMap).toMatchObject({
        'id:irn|id:create|id:subject|id:environment': {
          isAuthorized: true,
          decision: 'PERMIT',
        },
      });
      expect(isAuthZSpy).toHaveBeenCalledTimes(1);
    });
  });

  test('useGetBatchADSDecision test', async () => {
    const sandbox = buildSandbox();
    const spy = jest
      .spyOn(sandbox.authorization, 'isAuthorizedBatch')
      .mockResolvedValue([
        { decision: DecisionType.PERMIT, isAuthorized: true },
        { decision: DecisionType.DENY, isAuthorized: false },
        { decision: DecisionType.PERMIT, isAuthorized: true },
      ]);

    const { result } = renderHook(useADS, {
      wrapper: ({ children }) => (
        <MockQuicksandProvider>
          <ADSProvider>{children}</ADSProvider>
        </MockQuicksandProvider>
      ),
    });

    const batchRequest = [
      {
        resource: { id: 'irn1' },
        action: { id: 'create1' },
        subject: { id: 'subject1' },
        environment: { id: 'environment1' },
      },
      {
        resource: { id: 'irn2' },
        action: { id: 'create2' },
        subject: { id: 'subject2' },
        environment: { id: 'environment2' },
      },
      {
        resource: { id: 'irn3' },
        action: { id: 'create3' },
        subject: { id: 'subject3' },
        environment: { id: 'environment3' },
      },
    ];

    await act(async () => {
      await result.current.getBatchADSDecision(sandbox, { batchRequest });
    });

    await waitFor(() => {
      expect(result.current.decisionMap).toMatchObject({
        'id:irn1|id:create1|id:subject1|id:environment1': {
          isAuthorized: true,
          decision: 'PERMIT',
        },
        'id:irn2|id:create2|id:subject2|id:environment2': {
          isAuthorized: false,
          decision: 'DENY',
        },
        'id:irn3|id:create3|id:subject3|id:environment3': {
          isAuthorized: true,
          decision: 'PERMIT',
        },
      });
    });

    // refetching
    await act(async () => {
      await result.current.getBatchADSDecision(sandbox, { batchRequest });
    });
    await waitFor(() => {
      expect(result.current.decisionMap).toMatchObject({
        'id:irn1|id:create1|id:subject1|id:environment1': {
          isAuthorized: true,
          decision: 'PERMIT',
        },
        'id:irn2|id:create2|id:subject2|id:environment2': {
          isAuthorized: false,
          decision: 'DENY',
        },
        'id:irn3|id:create3|id:subject3|id:environment3': {
          isAuthorized: true,
          decision: 'PERMIT',
        },
      });
      expect(spy).toHaveBeenCalledTimes(1);
    });

    // refetching with different batch request
    const newBatch = [
      {
        resource: { id: 'irn1' },
        action: { id: 'create1' },
        subject: { id: 'subject1' },
        environment: { id: 'environment1' },
      },
      {
        resource: { id: 'irn2' },
        action: { id: 'create2' },
        subject: { id: 'subject2' },
        environment: { id: 'environment2' },
      },
      {
        resource: { id: 'irn4' },
        action: { id: 'create4' },
        subject: { id: 'subject4' },
        environment: { id: 'environment4' },
      },
    ];

    // refetching
    await act(async () => {
      await result.current.getBatchADSDecision(sandbox, {
        batchRequest: newBatch,
      });
    });
    await waitFor(() => {
      expect(result.current.decisionMap).toMatchObject({
        'id:irn1|id:create1|id:subject1|id:environment1': {
          isAuthorized: true,
          decision: 'PERMIT',
        },
        'id:irn2|id:create2|id:subject2|id:environment2': {
          isAuthorized: false,
          decision: 'DENY',
        },
        'id:irn3|id:create3|id:subject3|id:environment3': {
          isAuthorized: true,
          decision: 'PERMIT',
        },
        'id:irn4|id:create4|id:subject4|id:environment4': {
          isAuthorized: true,
          decision: 'PERMIT',
        },
      });
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});
