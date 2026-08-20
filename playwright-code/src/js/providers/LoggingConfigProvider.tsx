import React, { createContext, useContext, useMemo } from 'react';
import {
  SandboxLogger,
  LogEventName,
  LogEventListener,
} from '@appfabric/sandbox-spec';
import { Sandbox } from 'src/js/common/sandbox';

export interface LoggingConfig {
  context?: Record<string, unknown>;
  prefix?: string;
}

interface LoggingConfigContextType {
  logger: SandboxLogger;
}

const LoggingConfigContext = createContext<
  LoggingConfigContextType | undefined
>(undefined);

class WrappedLogger implements SandboxLogger {
  private logger: SandboxLogger;

  private context?: Record<string, unknown>;

  private prefix?: string;

  constructor(logger: SandboxLogger, config: LoggingConfig) {
    this.logger = logger;
    this.context = config.context;
    this.prefix = config.prefix;
  }

  private format(msg: string): string {
    let result = msg;
    if (this.prefix) result = `[${this.prefix}] ${result}`;
    return result;
  }

  private mergeProps(
    props?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (this.context && typeof this.context === 'object') {
      return { ...this.context, ...(props || {}) };
    }
    return props;
  }

  debug(message: string, properties?: Record<string, unknown>): void {
    this.logger.debug(this.format(message), this.mergeProps(properties));
  }

  log(message: string, properties?: Record<string, unknown>): void {
    this.logger.log(this.format(message), this.mergeProps(properties));
  }

  info(message: string, properties?: Record<string, unknown>): void {
    this.logger.info(this.format(message), this.mergeProps(properties));
  }

  warn(message: string, properties?: Record<string, unknown>): void {
    this.logger.warn(this.format(message), this.mergeProps(properties));
  }

  error(message: string, properties?: Record<string, unknown>): void {
    this.logger.error(this.format(message), this.mergeProps(properties));
  }

  fatal(
    message: string,
    properties?: Record<string, unknown>,
    options?: unknown,
  ): void {
    this.logger.fatal(
      this.format(message),
      this.mergeProps(properties),
      options,
    );
  }

  logException(
    message: string,
    exception: Error,
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): void {
    this.logger.logException(
      this.format(message),
      exception,
      this.mergeProps(properties),
      options,
    );
  }

  isLevelDebug(): boolean {
    return this.logger.isLevelDebug();
  }

  isLevelLog(): boolean {
    return this.logger.isLevelLog();
  }

  isLevelInfo(): boolean {
    return this.logger.isLevelInfo();
  }

  isLevelWarn(): boolean {
    return this.logger.isLevelWarn();
  }

  isLevelError(): boolean {
    return this.logger.isLevelError();
  }

  isLevelFatal(): boolean {
    return this.logger.isLevelFatal();
  }

  on(
    logEventName: LogEventName,
    callback: LogEventListener,
    context: Record<string, unknown>,
  ): SandboxLogger {
    return this.logger.on(logEventName, callback, context);
  }

  off(logEventName: LogEventName, callback: LogEventListener): SandboxLogger {
    return this.logger.off(logEventName, callback);
  }
}

interface LoggingConfigProviderProps extends LoggingConfig {
  sandbox: Sandbox;
  children: React.ReactNode;
}

export const LoggingConfigProvider: React.FC<LoggingConfigProviderProps> = ({
  sandbox,
  context,
  prefix,
  children,
}) => {
  const wrappedLogger = useMemo(
    () => new WrappedLogger(sandbox.logger, { context, prefix }),
    [sandbox.logger, context, prefix],
  );

  const value = useMemo(() => ({ logger: wrappedLogger }), [wrappedLogger]);

  return (
    <LoggingConfigContext.Provider value={value}>
      {children}
    </LoggingConfigContext.Provider>
  );
};

export function useLoggingConfig() {
  const ctx = useContext(LoggingConfigContext);
  if (!ctx) {
    throw new Error(
      'useLoggingConfig must be used within a LoggingConfigProvider',
    );
  }
  return ctx.logger;
}
