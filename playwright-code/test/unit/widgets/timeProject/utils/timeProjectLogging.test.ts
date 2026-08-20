import {
  withLoggedOperation,
  logNavigationEvent,
} from 'src/js/widgets/timeProject/utils/timeProjectLogging';

const makeLogger = () => ({
  debug: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  logException: jest.fn(),
  isLevelDebug: () => false,
  isLevelLog: () => false,
  isLevelInfo: () => false,
  isLevelWarn: () => false,
  isLevelError: () => false,
  isLevelFatal: () => false,
  on: jest.fn(),
  off: jest.fn(),
});

describe('timeProjectLogging', () => {
  describe('logNavigationEvent', () => {
    it('emits an info log with the supplied props', () => {
      const logger = makeLogger();
      logNavigationEvent(logger, 'TEST_EVENT', { foo: 'bar' });
      expect(logger.info).toHaveBeenCalledWith('TEST_EVENT', { foo: 'bar' });
    });

    it('emits an info log with empty props by default', () => {
      const logger = makeLogger();
      logNavigationEvent(logger, 'TEST_EVENT');
      expect(logger.info).toHaveBeenCalledWith('TEST_EVENT', {});
    });
  });

  describe('withLoggedOperation', () => {
    const event = {
      start: 'Op Started',
      success: 'Op Success',
      failure: 'Op Failure',
    };

    it('runs the function and emits start + success logs with durationMs', async () => {
      const logger = makeLogger();
      const run = jest.fn().mockResolvedValue('ok');

      const result = await withLoggedOperation({ logger, event, run });

      expect(result).toBe('ok');
      expect(logger.info).toHaveBeenCalledWith('Op Started', {});
      expect(logger.info).toHaveBeenCalledWith(
        'Op Success',
        expect.objectContaining({
          result: 'success',
          durationMs: expect.any(Number),
        }),
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('logs failure and rethrows when run() throws', async () => {
      const logger = makeLogger();
      const err = new Error('network down');
      const run = jest.fn().mockRejectedValue(err);

      await expect(withLoggedOperation({ logger, event, run })).rejects.toThrow(
        'network down',
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Op Failure',
        expect.objectContaining({
          result: 'failure',
          durationMs: expect.any(Number),
          errorMessage: 'network down',
          errorName: 'Error',
        }),
      );
    });

    it('treats result as failure when isFailure returns a reason', async () => {
      const logger = makeLogger();
      const run = jest.fn().mockResolvedValue({ data: { errorCode: 'BAD' } });

      const out = await withLoggedOperation({
        logger,
        event,
        run,
        isFailure: (res: any) => res.data.errorCode,
      });

      expect(out).toEqual({ data: { errorCode: 'BAD' } });
      expect(logger.info).not.toHaveBeenCalledWith(
        'Op Success',
        expect.anything(),
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Op Failure',
        expect.objectContaining({
          result: 'failure',
          reason: 'BAD',
          durationMs: expect.any(Number),
        }),
      );
    });

    it('passes extraProps through to every log line', async () => {
      const logger = makeLogger();
      const run = jest.fn().mockResolvedValue('ok');

      await withLoggedOperation({
        logger,
        event,
        extraProps: { projectId: 'p-1', pageSize: 10 },
        run,
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Op Started',
        expect.objectContaining({ projectId: 'p-1', pageSize: 10 }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Op Success',
        expect.objectContaining({ projectId: 'p-1', pageSize: 10 }),
      );
    });

    // FCI wiring: a stub sandbox whose performance returns a fake interaction
    // lets us assert how the operation ends the customer interaction.
    const makeFciSandbox = () => {
      const interaction = {
        success: jest.fn(),
        fail: jest.fn(),
        abort: jest.fn(),
        setDegraded: jest.fn(),
        addMetadata: jest.fn(),
      };
      const sandbox = {
        logger: makeLogger(),
        performance: {
          createCustomerInteraction: jest.fn(() => interaction),
          getCustomerInteraction: jest.fn(() => interaction),
          record: jest.fn(),
        },
      } as any;
      return { sandbox, interaction };
    };

    it('marks the FCI failed on error when degradeOnFailure is false', async () => {
      const logger = makeLogger();
      const { sandbox, interaction } = makeFciSandbox();
      const run = jest.fn().mockResolvedValue({ data: { errorCode: 'BAD' } });

      await withLoggedOperation({
        logger,
        event,
        sandbox,
        interactionName: 'op-interaction',
        isFailure: (res: any) => res.data.errorCode,
        run,
      });

      expect(
        sandbox.performance.createCustomerInteraction,
      ).toHaveBeenCalledWith('op-interaction', undefined, {
        returnExistingCI: true,
      });
      expect(interaction.fail).toHaveBeenCalledWith('BAD');
      expect(interaction.setDegraded).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Op Failure',
        expect.objectContaining({ result: 'failure', reason: 'BAD' }),
      );
    });

    it('marks the FCI degraded (then success) on error when degradeOnFailure is true', async () => {
      const logger = makeLogger();
      const { sandbox, interaction } = makeFciSandbox();
      const run = jest.fn().mockResolvedValue({ data: { errorCode: 'BAD' } });

      await withLoggedOperation({
        logger,
        event,
        sandbox,
        interactionName: 'op-interaction',
        degradeOnFailure: true,
        isFailure: (res: any) => res.data.errorCode,
        run,
      });

      expect(interaction.setDegraded).toHaveBeenCalledWith('BAD');
      expect(interaction.success).toHaveBeenCalled();
      expect(interaction.fail).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Op Failure',
        expect.objectContaining({ result: 'degraded', reason: 'BAD' }),
      );
    });

    it('marks the FCI success on a clean result', async () => {
      const logger = makeLogger();
      const { sandbox, interaction } = makeFciSandbox();
      const run = jest.fn().mockResolvedValue('ok');

      await withLoggedOperation({
        logger,
        event,
        sandbox,
        interactionName: 'op-interaction',
        run,
      });

      expect(interaction.success).toHaveBeenCalled();
      expect(interaction.fail).not.toHaveBeenCalled();
      expect(interaction.setDegraded).not.toHaveBeenCalled();
    });
  });
});
