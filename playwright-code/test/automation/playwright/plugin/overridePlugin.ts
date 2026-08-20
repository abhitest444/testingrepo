/* eslint-disable no-console, import/prefer-default-export, no-underscore-dangle, consistent-return */

import * as fs from 'fs';
import { Page } from '@playwright/test';

const DEFAULT_PLUGIN_URL =
  'https://plugin-localhost.intuitcdn.net:34212/config.json';
const CDN_BASE_URL = 'https://plugin.intuitcdn.net';
const PLUGIN_ID = 'time-tracking-ui';

interface PluginOverrideConfig {
  configUrl: string;
  hasLayers: boolean;
  id: string;
  extendedProperties?: Record<string, unknown>;
  mergeExtendedProperties?: boolean;
}

const buildCdnConfigUrl = (pluginId: string, version: string): string =>
  `${CDN_BASE_URL}/${pluginId}/${version}/config.json`;

const parsePluginOverrides = (): Record<string, string> => {
  const overridesEnv = process?.env?.PLUGIN_OVERRIDES;
  if (!overridesEnv) {
    return {};
  }

  try {
    const parsed = JSON.parse(overridesEnv);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      console.error(
        'PLUGIN_OVERRIDES must be a JSON object mapping plugin IDs to versions',
      );
      return {};
    }
    return parsed as Record<string, string>;
  } catch (err) {
    console.error('Error parsing PLUGIN_OVERRIDES JSON:', err);
    return {};
  }
};

const getLocalExtendedProperties = async (): Promise<
  Record<string, unknown> | undefined
> => {
  try {
    const data = await fs.promises.readFile('src/config.json', 'utf8');
    const config = JSON.parse(data);
    return config.extendedProperties;
  } catch (err) {
    console.error('Error reading or parsing config.json file:', err);
    return undefined;
  }
};

export const overridePlugin = async (page: Page) => {
  const plugins: PluginOverrideConfig[] = [];
  const isLocal = process?.env?.PLAYWRIGHT_ENV === 'local';
  const pluginReleaseVersion = process?.env?.PLUGIN_RELEASE_VERSION;
  const externalOverrides = parsePluginOverrides();

  // Handle time-tracking-ui (this repo's plugin)
  if (isLocal || pluginReleaseVersion) {
    const extendedProperties = await getLocalExtendedProperties();
    if (!extendedProperties) {
      return;
    }

    const configUrl = isLocal
      ? DEFAULT_PLUGIN_URL
      : buildCdnConfigUrl(PLUGIN_ID, pluginReleaseVersion!);

    console.log(
      `Overriding ${PLUGIN_ID} - ${isLocal ? 'local' : pluginReleaseVersion}`,
    );

    plugins.push({
      configUrl,
      hasLayers: true,
      id: PLUGIN_ID,
      extendedProperties,
      mergeExtendedProperties: true,
    });
  }

  // Handle external plugin overrides from PLUGIN_OVERRIDES env var
  for (const [pluginId, version] of Object.entries(externalOverrides)) {
    // Skip if it's time-tracking-ui (already handled above with local extendedProperties)
    if (pluginId === PLUGIN_ID) {
      console.log(
        `Skipping ${PLUGIN_ID} in PLUGIN_OVERRIDES - use PLUGIN_RELEASE_VERSION instead`,
      );
      continue;
    }

    const configUrl = buildCdnConfigUrl(pluginId, version);
    console.log(`Overriding external plugin ${pluginId} - ${version}`);

    plugins.push({
      configUrl,
      hasLayers: true,
      id: pluginId,
    });
  }

  if (plugins.length === 0) {
    console.log('No plugin override found.');
    return;
  }

  const result = await page.evaluate(
    (pluginConfigs: PluginOverrideConfig[]) => {
      const val = JSON.stringify({ plugins: pluginConfigs });
      // @ts-ignore
      const prefixStr = `${window.__shellInternal.customContext.pluginOverridesLocalStoragePrefix}_ecosystem_plugins`;
      window.localStorage.setItem(prefixStr, val);

      // Verify the override was applied successfully
      const storedValue = window.localStorage.getItem(prefixStr);
      if (!storedValue) {
        return {
          success: false,
          error: 'localStorage value not found after setting',
        };
      }

      try {
        const parsed = JSON.parse(storedValue);
        const storedPluginIds =
          parsed.plugins?.map((p: { id: string }) => p.id) || [];
        const expectedPluginIds = pluginConfigs.map((p) => p.id);
        const allPluginsFound = expectedPluginIds.every((id) =>
          storedPluginIds.includes(id),
        );

        if (!allPluginsFound) {
          return {
            success: false,
            error: `Plugin mismatch. Expected: ${expectedPluginIds.join(
              ', ',
            )}, Found: ${storedPluginIds.join(', ')}`,
          };
        }

        return { success: true, pluginIds: storedPluginIds };
      } catch (err) {
        return {
          success: false,
          error: `Failed to parse stored value: ${err}`,
        };
      }
    },
    plugins,
  );

  if (result.success) {
    console.log(
      `Plugin override verified successfully. Overridden plugins: ${result.pluginIds.join(
        ', ',
      )}`,
    );
  } else {
    console.error(`Plugin override verification failed: ${result.error}`);
  }

  return result.success;
};
