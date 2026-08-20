import { useSandbox } from '@payroll/quicksand';
import { Sandbox } from 'src/js/common/sandbox';

const isProjectsActivated = (sandbox: Sandbox) =>
  sandbox.extensions &&
  sandbox.extensions.qbo.plugins.isPluginActivated('projects-plugin');

const hasProjectCreated = (sandbox: Sandbox) =>
  sandbox.extensions &&
  sandbox.extensions.qbo &&
  sandbox.extensions.qbo.webStorage &&
  sandbox.extensions.qbo.webStorage
    .persistent()
    .getItemByCompanyId('project_create_ftu_shown');

export const useHasProjects = (): boolean => {
  const sandbox = useSandbox();
  return (hasProjectCreated(sandbox) && isProjectsActivated(sandbox)) || false;
};
