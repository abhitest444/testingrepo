import { QuickbooksOnlineSandbox } from '@payroll/quicksand/node_modules/@appfabric/sandbox-spec/lib/extensions/quickbooks-online/QuickbooksOnline';
import { Sandbox } from 'src/js/common/sandbox';

describe('Sandbox Type Alias', () => {
  it('should be an alias for QuickbooksOnlineSandbox', () => {
    const sandboxInstance: Sandbox = {} as QuickbooksOnlineSandbox;
    expect(sandboxInstance).toBeDefined();
  });
});
