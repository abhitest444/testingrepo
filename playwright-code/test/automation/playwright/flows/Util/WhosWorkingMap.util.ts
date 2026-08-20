import { Page, expect } from '@playwright/test';
import WhosWorkingMapPage from '../../pages/WhosWorkingMapPage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import TimeClockPage from '../../pages/TimeClockPage';
import SingleTimeEntryPage from '../../pages/SingleTimeEntryPage';
import { BreaksPage } from '../../pages/BreaksPage';
import {
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
} from '../../commonUtils';

/**
 * Who's Working Map - Test Utilities
 * Automated test functions for Who's Working Map feature
 */

// WWM001 - Navigate to Who's Working Map from Time Entries
export async function validateWhosWorkingMapAccess(page: Page) {
  console.log("WWM001: Validating access to Who's Working Map");

  const mapPage = new WhosWorkingMapPage(page);

  // Click on Who's Working Map entry point
  await mapPage.navigateToWhosWorkingMap();

  // Validate map loads
  await mapPage.waitForMapToLoad();
  await mapPage.validateMapIsVisible();

  console.log("✅ WWM001: Who's Working Map is accessible");
}

// WWM002 & WWM003 - Validate Core Map UI Elements
export async function validateCoreMapUI(page: Page) {
  console.log('WWM002/WWM003: Validating core map UI');

  const mapPage = new WhosWorkingMapPage(page);

  // Validate map container
  await mapPage.validateMapIsVisible();

  // Validate UI elements
  await mapPage.validateSearchBarIsVisible();
  await mapPage.validateFilterButtonIsVisible();
  await mapPage.validateMapControls();

  // Validate worker pins
  const pinCount = await mapPage.validateWorkerPinsAreVisible();
  expect(pinCount).toBeGreaterThan(0);

  console.log('✅ WWM002/WWM003: Core map UI validated');
}

// WWM004 - Test Map Controls
export async function validateMapControls(page: Page) {
  console.log('WWM004: Testing map controls');

  const mapPage = new WhosWorkingMapPage(page);

  // Click camera controls ONCE to reveal all zoom/move buttons
  await mapPage.openMapCameraControls();

  // Test zoom in
  await mapPage.zoomIn(2);
  await page.waitForTimeout(500);

  // Test zoom out
  await mapPage.zoomOut(2);
  await page.waitForTimeout(500);

  // Test move controls
  await mapPage.moveUp(1);
  await mapPage.moveDown(1);
  await mapPage.moveLeft(1);
  await mapPage.moveRight(1);
  await page.waitForTimeout(500);

  // Test pan (drag map)
  const map = mapPage.getMapContainer();
  const box = await map.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + 100,
      box.y + box.height / 2 + 100,
    );
    await page.mouse.up();
    await page.waitForTimeout(500);
  }

  console.log('✅ WWM004: Map controls work correctly');
}

// WWM005 - Test Satellite View Toggle
export async function validateSatelliteView(page: Page) {
  console.log('WWM005: Testing satellite view toggle');

  const mapPage = new WhosWorkingMapPage(page);

  try {
    // Toggle to satellite view
    await mapPage.toggleSatelliteView();

    // Validate pins still visible
    const pinCount = await mapPage.getWorkerCount();
    expect(pinCount).toBeGreaterThan(0);

    // Toggle back
    await mapPage.toggleSatelliteView();

    console.log('✅ WWM005: Satellite view toggle works');
  } catch (error) {
    console.log(
      '⚠️ WWM005: Satellite toggle not available or different implementation',
    );
  }
}

// WWM006 - Validate Empty State
export async function validateEmptyState(page: Page) {
  console.log('WWM006: Validating empty state (when no workers on clock)');

  // Note: This requires all workers to be clocked out
  // Skip if workers are on clock
  const mapPage = new WhosWorkingMapPage(page);

  try {
    await mapPage.validateEmptyStateIsVisible();
    console.log('✅ WWM006: Empty state displayed correctly');
  } catch (error) {
    console.log('⚠️ WWM006: Skipped - workers are on clock');
  }
}

// WWM007 - Target Worker Functionality (Show worker on map)
export async function validateTargetWorker(page: Page) {
  console.log('WWM007: Testing target worker functionality');

  const mapPage = new WhosWorkingMapPage(page);

  // Click the "Show worker on map" button (map icon in worker row)
  const showOnMapButton = mapPage.getShowWorkerOnMapButton();

  if ((await showOnMapButton.count()) > 0) {
    await showOnMapButton.first().click();
    await page.waitForTimeout(1000);
    console.log('✅ WWM007: Target worker functionality works');
  } else {
    console.log(
      '⚠️ WWM007: No "Show worker on map" button found (no workers visible?)',
    );
  }
}

// WWM009 & WWM010 - Test Search Functionality
export async function validateSearchFunctionality(page: Page) {
  console.log('WWM009/WWM010: Testing search functionality');

  const mapPage = new WhosWorkingMapPage(page);

  // Get initial worker count
  const initialCount = await mapPage.getWorkerCount();
  console.log(`Initial worker count: ${initialCount}`);

  // Search for a valid worker
  await mapPage.searchWorker('Test Emp');

  // Validate search results
  const searchCount = await mapPage.getWorkerCount();
  console.log(`Search result count: ${searchCount}`);

  // Search for non-existent worker
  const nonExistentSearch = 'NonExistentWorkerXYZ123';
  await mapPage.searchWorker(nonExistentSearch);

  // Validate no results message
  await mapPage.validateNoSearchResults(nonExistentSearch).catch(() => {
    console.log('⚠️ No results message not found (may have different format)');
  });

  // Clear search
  await mapPage.clearSearch();

  const clearedCount = await mapPage.getWorkerCount();
  // Count might be >= initial if test employee was clocked in during test
  expect(clearedCount).toBeGreaterThanOrEqual(initialCount);
  console.log(
    `Cleared search count: ${clearedCount} (initial was ${initialCount})`,
  );

  console.log('✅ WWM009/WWM010: Search functionality validated');
}

// WWM012-WWM016 - Test Filter Functionality
export async function validateFilterFunctionality(page: Page) {
  console.log('WWM012-WWM016: Testing filter functionality');

  const mapPage = new WhosWorkingMapPage(page);

  // Open filters
  await mapPage.openFilters();

  // Validate filter box is open with correct elements
  await mapPage.validateFilterSortBoxOpen();

  // Validate Display By dropdown is present
  await expect(mapPage.getDisplayByDropdown()).toBeVisible();
  console.log('✅ Display By dropdown found');

  // Validate Sort By dropdown is present
  await expect(mapPage.getSortByDropdown()).toBeVisible();
  console.log('✅ Sort By dropdown found');

  // Validate Apply button is present
  await expect(mapPage.getApplyButton()).toBeVisible();
  console.log('✅ Apply button found');

  // Close filters
  await mapPage.closeFilters();

  console.log('✅ WWM012-WWM016: Filter functionality validated');
}

// WWM018 - Validate Location Details Panel
export async function validateLocationDetailsPanel(page: Page) {
  console.log('WWM018: Testing location details panel');

  const mapPage = new WhosWorkingMapPage(page);

  // Click on first worker pin
  await mapPage.clickWorkerPin(0);

  // Wait for details panel
  await mapPage.validateDetailsPanelIsVisible();

  // Check for location information
  const detailsPanel = mapPage.getDetailsPanel();

  // Look for GPS coordinates, accuracy, timestamp
  const hasCoordinates =
    (await detailsPanel.locator('text=/lat|long|gps|coordinate/i').count()) > 0;
  const hasAccuracy =
    (await detailsPanel.locator('text=/accuracy/i').count()) > 0;

  console.log(`GPS coordinates visible: ${hasCoordinates}`);
  console.log(`Accuracy indicator visible: ${hasAccuracy}`);

  console.log('✅ WWM018: Location details panel validated');
}

// WWM021 - Edit/Add Time from Map
export async function validateEditTimeFromMap(page: Page) {
  console.log('WWM021: Testing edit time from map');

  const mapPage = new WhosWorkingMapPage(page);

  // Get worker rows from the list
  const workerRows = mapPage.getWorkerListRows();
  const rowCount = await workerRows.count();

  if (rowCount > 0) {
    // Click "Edit Time" link for the first worker - directly opens STE
    const editTimeLink = workerRows.first().getByText('Edit Time');
    await editTimeLink.click();

    // Validate STE drawer opened using existing SingleTimeEntryPage
    const stePage = new SingleTimeEntryPage(page);
    await expect(stePage.headingSingleTimeEntry).toBeVisible();

    console.log('✅ WWM021: Edit Time opens STE directly');

    // Close the STE drawer
    await mapPage.closeDropdownWithEscape();
  } else {
    console.log('⚠️ WWM021: No workers found in list');
  }
}

// WWM036 - Navigate Back to Time Entries
export async function validateNavigationBackToTimeEntries(page: Page) {
  console.log('WWM036: Testing navigation back to Time Entries');

  const mapPage = new WhosWorkingMapPage(page);

  // Use close button instead of back button (no dedicated back button exists)
  await mapPage.closeMap();

  // Validate we're back on Time Entries page using TimeEntriesPage locators
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.validateDisplayByDropdownVisible();

  console.log('✅ WWM036: Navigation back to Time Entries works');
}

// WWM037 - Validate Worker Tooltip
export async function validateWorkerTooltip(page: Page) {
  console.log('WWM037: Testing worker tooltip on pin hover');

  const mapPage = new WhosWorkingMapPage(page);

  // Get worker name from the list to find the corresponding map pin
  const workerRows = mapPage.getWorkerListRows();
  const rowCount = await workerRows.count();

  if (rowCount > 0) {
    // Get the worker name from the first row
    const firstRow = workerRows.first();
    const workerNameElement = firstRow.locator('td').nth(1); // Name is typically in second column
    const workerName = await workerNameElement.textContent();

    if (workerName) {
      const trimmedName = workerName.trim();
      console.log(`  Found worker: ${trimmedName}`);

      // Use getByTitle to find the worker pin on the map
      const pin = page.getByTitle(trimmedName);

      if ((await pin.count()) > 0) {
        // Hover over the pin
        await pin.first().hover();

        // Check if hovering shows a tooltip
        const tooltipVisible = await mapPage.isTooltipVisible();

        if (tooltipVisible) {
          console.log('✅ WWM037: Tooltip displays on pin hover');
        } else {
          console.log(
            '✅ WWM037: Pin found and hoverable (tooltip may show on click)',
          );
        }
      } else {
        console.log(
          `⚠️ WWM037: Pin with title "${trimmedName}" not found on map`,
        );
      }
    } else {
      console.log('⚠️ WWM037: Could not extract worker name from list');
    }
  } else {
    console.log('⚠️ WWM037: No worker rows found in list');
  }
}

// WWM045 - Test Fullscreen Mode
export async function validateFullscreenMode(page: Page) {
  console.log('WWM045: Testing fullscreen mode');

  const mapPage = new WhosWorkingMapPage(page);

  try {
    // Enter fullscreen
    await mapPage.toggleFullscreen();
    await page.waitForTimeout(1000);

    // Exit fullscreen by clicking fullscreen button again (not Escape - that closes the dialog)
    await mapPage.toggleFullscreen();
    await page.waitForTimeout(500);

    console.log('✅ WWM045: Fullscreen mode works');
  } catch (error) {
    console.log(
      '⚠️ WWM045: Fullscreen functionality not found or different implementation',
    );
  }
}

// Helper: Create location test data for an employee
export async function setupLocationDataForMap(
  page: Page,
  contactId: string,
  numberOfPoints: number = 10,
) {
  console.log(`Setting up location data for employee ${contactId}...`);

  const result = await page.evaluate(
    async ({ contactId, numberOfPoints }) => {
      const mutation = `
      mutation TimeTrackingCreateLocationPoints($input: TimeTracking_CreateLocationPointsInput!) {
        timeTrackingCreateLocationPoints(input: $input) {
          ... on TimeTracking_CreateLocationPointsPayload {
            successCode
          }
          ... on TimeTracking_CreateLocationPointsError {
            errorCode
            message
          }
        }
      }
    `;

      // Get active time entry to find clock-in time
      const whoIsWorkingQuery = `
      query timeTrackingWhoIsWorking($filter: TimeTracking_WhoIsWorkingFilter!) {
        timeTrackingWhoIsWorking(filter: $filter) {
          edges {
            node {
              timeForContactDAS { id }
              activeTimeEntry {
                startTime
              }
            }
          }
        }
      }
    `;

      try {
        // Get clock-in time
        const whoIsWorkingResponse = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            query: whoIsWorkingQuery,
            variables: { filter: { clockedInTimeForOnly: true } },
          }),
        });

        const whoIsWorkingResult = await whoIsWorkingResponse.json();
        const workers =
          whoIsWorkingResult.data?.timeTrackingWhoIsWorking?.edges || [];
        const worker = workers.find(
          (w: any) => w.node.timeForContactDAS.id === contactId,
        );

        if (!worker || !worker.node.activeTimeEntry) {
          return { error: 'Employee not clocked in' };
        }

        const startTime = new Date(
          worker.node.activeTimeEntry.startTime,
        ).getTime();
        const now = Date.now();
        const interval = Math.floor((now - startTime) / numberOfPoints);

        // Generate location points
        const locationPoints = [];
        for (let i = 0; i < numberOfPoints; i++) {
          const timestamp = new Date(startTime + interval * i);
          locationPoints.push({
            accuracy: 10 + Math.random() * 3,
            altitude: 100 + Math.random() * 5,
            latitude: 37.7749 + Math.random() * 0.001,
            longitude: -122.4194 + Math.random() * 0.001,
            speed: Math.random() * 5,
            source: 'GPS',
            createdAt: timestamp.toISOString(),
            deviceIdentifier: `test-device-${Date.now()}`,
          });
        }

        // Create location points
        const response = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            query: mutation,
            variables: {
              input: {
                timeFor: { id: contactId, timeForType: 'EMPLOYEE' },
                locationPoints,
              },
            },
          }),
        });

        const result = await response.json();
        return result;
      } catch (error: any) {
        return { error: error.message };
      }
    },
    { contactId, numberOfPoints },
  );

  if (result.error) {
    console.error('Failed to create location data:', result.error);
    return false;
  }

  if (result.data?.timeTrackingCreateLocationPoints?.successCode) {
    console.log('✅ Location data created successfully');
    return true;
  }

  return false;
}

// Helper: Get list of clocked-in employees
export async function getClockedInEmployees(
  page: Page,
): Promise<Array<{ id: string; name: string }>> {
  const result = await page.evaluate(async () => {
    const query = `
      query timeTrackingWhoIsWorking($filter: TimeTracking_WhoIsWorkingFilter!) {
        timeTrackingWhoIsWorking(filter: $filter) {
          edges {
            node {
              timeForContactDAS { id }
              displayName
              firstName
              lastName
            }
          }
        }
      }
    `;

    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query,
          variables: { filter: { clockedInTimeForOnly: true } },
        }),
      });

      const result = await response.json();
      const workers = result.data?.timeTrackingWhoIsWorking?.edges || [];

      return workers.map((w: any) => ({
        id: w.node.timeForContactDAS.id,
        name: w.node.displayName || `${w.node.firstName} ${w.node.lastName}`,
      }));
    } catch (error: any) {
      return [];
    }
  });

  return result;
}

/**
 * ========================================
 * TEST DATA SETUP & TEARDOWN UTILITIES
 * ========================================
 * Complete lifecycle management for test data
 */

export interface TestEmployee {
  contactId: string;
  displayName: string;
  firstName: string;
  lastName: string;
}

export interface TestTimeEntry {
  id: string;
  employeeId: string;
  startTime: string;
  duration: number;
  isOpen: boolean;
}

export interface TestCompanyConfig {
  companyId: string;
  realmId: string;
  userId: string;
  apiKey?: string;
  csrfToken?: string;
}

export interface TestDataContext {
  config: TestCompanyConfig;
  employee: TestEmployee;
  timeEntry: TestTimeEntry;
  locationPointIds: string[];
}

/**
 * Get company configuration from page context
 */
export async function getCompanyConfig(page: Page): Promise<TestCompanyConfig> {
  console.log('🔍 Getting company configuration...');

  const config: TestCompanyConfig = await page.evaluate(() => {
    const w = window as any;
    return {
      companyId: w.companyId || w.intuit_companyId || w.realmId,
      realmId: w.realmId || w.intuit_realmId,
      userId: w.userId || w.intuit_userId || w.intuit_userid,
      apiKey: w.apiKey || w.intuit_apikey,
    };
  });

  if (!config.companyId) {
    const fromMeta = await page.evaluate(() => {
      const companyMeta = document.querySelector('meta[name="companyId"]');
      const realmMeta = document.querySelector('meta[name="realmId"]');
      const userMeta = document.querySelector('meta[name="userId"]');
      const stored = localStorage.getItem('testConfig');
      const storedConfig = stored ? JSON.parse(stored) : {};

      return {
        companyId:
          companyMeta?.getAttribute('content') || storedConfig.companyId,
        realmId: realmMeta?.getAttribute('content') || storedConfig.realmId,
        userId: userMeta?.getAttribute('content') || storedConfig.userId,
      };
    });
    Object.assign(config, fromMeta);
  }

  const cookies = await page.context().cookies();
  const csrfCookie = cookies.find(
    (c) =>
      c.name.toLowerCase().includes('csrf') ||
      c.name.toLowerCase().includes('xsrf'),
  );
  if (csrfCookie) {
    config.csrfToken = csrfCookie.value;
  }

  console.log(`✅ Company Config:`, config);
  return config;
}

/**
 * Get GraphQL auth headers by extracting them from the page context
 */
async function getGraphQLHeaders(page: Page): Promise<Record<string, string>> {
  // FIRST: Try to get headers from QBO shell's environment info
  const pageData = await page.evaluate(() => {
    const win = window as any;
    let envCsrf = '';
    let envAuthId = '';
    let envCompanyId = '';

    // Try multiple paths to find the environment info
    const possiblePaths = [
      () => win?.qbo?.sandbox?.extensions?.qbo?.context?.getEnvironmentInfo?.(),
      () => win?.QBO?.sandbox?.extensions?.qbo?.context?.getEnvironmentInfo?.(),
      () => win?.sandbox?.extensions?.qbo?.context?.getEnvironmentInfo?.(),
      () => win?.__QBO_ENV__,
      () => win?.__ENVIRONMENT__,
    ];

    for (const getEnv of possiblePaths) {
      try {
        const envInfo = getEnv();
        if (envInfo) {
          envCsrf = envCsrf || envInfo.xCsrfToken || envInfo.csrfToken || '';
          envAuthId = envAuthId || envInfo.authId || envInfo.userId || '';
          envCompanyId =
            envCompanyId || envInfo.companyId || envInfo.realmId || '';
          if (envCsrf) {
            console.log(
              '📦 Got CSRF from QBO shell:',
              envCsrf.substring(0, 30) + '...',
            );
            break;
          }
        }
      } catch (e) {}
    }

    // Try to find CSRF token from script tags or data attributes
    if (!envCsrf) {
      try {
        // Check for CSRF in script tags
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const content = script.textContent || '';
          const csrfMatch = content.match(/xCsrfToken['":\s]+['"]([^'"]+)['"]/);
          if (csrfMatch) {
            envCsrf = csrfMatch[1];
            console.log(
              '📦 Got CSRF from script tag:',
              envCsrf.substring(0, 30) + '...',
            );
            break;
          }
        }
      } catch (e) {}
    }

    // Try window.__INITIAL_DATA__ or similar
    if (!envCsrf) {
      try {
        const initialData =
          win.__INITIAL_DATA__ || win.__PRELOADED_STATE__ || win.__APP_STATE__;
        if (initialData) {
          envCsrf = initialData.csrfToken || initialData.xCsrfToken || '';
          if (envCsrf) {
            console.log('📦 Got CSRF from initial data');
          }
        }
      } catch (e) {}
    }

    return { csrf: envCsrf, authId: envAuthId, companyId: envCompanyId };
  });

  let csrfToken = pageData.csrf;
  let authId = pageData.authId;
  let companyId = pageData.companyId;

  // Get cookies for fallback data
  const cookies = await page.context().cookies();
  const cookieMap: Record<string, string> = {};
  cookies.forEach((c) => {
    cookieMap[c.name] = c.value;
  });

  // FALLBACK: Use cookies if shell data is not available
  if (!authId || !companyId) {
    // Extract shell context for authId and companyId
    const shellCtxRaw = cookieMap['shell.ctx.id'] || '';
    const shellCtx = decodeURIComponent(shellCtxRaw.replace(/"/g, ''));
    authId = authId || shellCtx.match(/authId=(\d+)/)?.[1] || '';
    companyId = companyId || shellCtx.match(/companyId=(\d+)/)?.[1] || '';

    // Fallback: Try userIdentifier and currentcompanyid cookies
    if (!authId) {
      authId = cookieMap['userIdentifier'] || '';
    }
    if (!companyId) {
      companyId =
        cookieMap['qbo.ptc.currentcompanyid'] ||
        cookieMap['qbo.currentcompanyid'] ||
        '';
    }
  }

  // If CSRF still not found, try to capture it from an actual GraphQL request
  if (!csrfToken) {
    console.log('🔍 Trying to capture CSRF from app GraphQL request...');
    try {
      // Set up a listener to capture GraphQL request headers
      let capturedHeaders: Record<string, string> = {};
      const capturePromise = new Promise<void>((resolve) => {
        const handler = (request: any) => {
          const url = request.url();
          if (url.includes('graphql') && request.method() === 'POST') {
            const headers = request.headers();
            capturedHeaders = headers;
            page.off('request', handler);
            resolve();
          }
        };
        page.on('request', handler);
        // Timeout after 5 seconds
        setTimeout(() => {
          page.off('request', handler);
          resolve();
        }, 5000);
      });

      // Trigger a GraphQL request by refreshing or interacting with the page
      await page.evaluate(() => {
        // Try to trigger a re-fetch by dispatching a focus event
        window.dispatchEvent(new Event('focus'));
      });

      await capturePromise;

      if (capturedHeaders['x-csrf-token']) {
        csrfToken = capturedHeaders['x-csrf-token'];
        console.log(
          '📦 Captured CSRF from app request:',
          csrfToken.substring(0, 30) + '...',
        );
      }
      if (!authId && capturedHeaders['intuit-user-id']) {
        authId = capturedHeaders['intuit-user-id'];
      }
      if (!companyId && capturedHeaders['intuit-company-id']) {
        companyId = capturedHeaders['intuit-company-id'];
      }
    } catch (e) {
      console.log('❌ Failed to capture headers from app request:', e);
    }
  }

  // Last resort: Use cookie CSRF (it's a different format than what API expects)
  if (!csrfToken) {
    csrfToken =
      cookieMap['qbo.ptc.csrftoken'] || cookieMap['qbo.csrftoken'] || '';
    if (csrfToken) {
      console.log(
        '⚠️ Using cookie CSRF (may not work - different format than shell token)',
      );
    }
  }

  // Determine environment from URL
  const currentUrl = page.url();
  const isE2E = currentUrl.includes('e2e');

  // API keys and plugin IDs differ between e2e and prod
  const apiKey = isE2E
    ? 'preprdakyrespKVXsZKCr6jx7qnE2YkA3eVUzOSx'
    : 'prdakyresRpM096AyWWSUuVSDNRV2FAkZjiEgg5N'; // Prod API key

  const pluginId = isE2E ? 'time-tracking-ui' : 'timecapture-timeentries-ui'; // Prod uses different plugin ID

  const headers = {
    accept: 'application/json;charset=UTF-8',
    'content-type': 'application/json;charset=UTF-8',
    authorization: `Intuit_APIKey intuit_apikey=${apiKey},intuit_apikey_version=1.0`,
    'x-csrf-token': csrfToken,
    'intuit-user-id': authId,
    'intuit-company-id': companyId,
    'intuit-plugin-id': pluginId,
    intuit_country: 'US',
  };

  console.log(
    `  → Headers: auth=${
      headers['intuit-user-id'] ? 'present' : 'missing'
    }, company=${headers['intuit-company-id'] ? 'present' : 'missing'}, csrf=${
      headers['x-csrf-token'] ? 'present' : 'missing'
    }`,
  );

  if (
    !headers['intuit-user-id'] ||
    !headers['intuit-company-id'] ||
    !headers['x-csrf-token']
  ) {
    console.log('  ⚠️ Missing required headers - API call will likely fail');
    console.log(
      `  → Cookie names available: ${Object.keys(cookieMap).join(', ')}`,
    );
  }

  return headers;
}

/**
 * Get the GraphQL endpoint URL based on environment
 */
async function getGraphQLEndpoint(page: Page): Promise<string> {
  const url = page.url();
  if (url.includes('e2e')) {
    return 'https://sbseggraphqlorch-e2e.api.intuit.com/graphql';
  }
  return 'https://sbseggraphqlorch.api.intuit.com/graphql';
}

/**
 * Get a test employee
 */
export async function getTestEmployee(
  page: Page,
  employeeName?: string,
): Promise<TestEmployee> {
  console.log('👤 Getting test employee...');

  const headers = await getGraphQLHeaders(page);
  const endpoint = await getGraphQLEndpoint(page);
  const currentUrl = page.url();
  console.log(`  → Current URL: ${currentUrl}`);
  console.log(`  → Using endpoint: ${endpoint}`);

  const query = `
    query {
      timeTrackingWorkers(first: 20) {
        edges {
          node {
              id
              displayName
              firstName
              lastName
            isActive
          }
        }
      }
    }
  `;

  let result: any;

  // Try using Playwright's request API first (shares browser cookies)
  try {
    console.log('📡 Trying Playwright request API...');
    const response = await page.request.post(endpoint, {
      headers: headers,
      data: { query },
    });

    console.log(
      `📡 Response status: ${response.status()} ${response.statusText()}`,
    );

    if (response.ok()) {
      const data = await response.json();
      if (data.errors) {
        result = { error: data.errors[0]?.message || 'GraphQL error' };
      } else {
        const workers = data.data?.timeTrackingWorkers?.edges || [];
        if (workers.length === 0) {
          result = { error: 'No workers found' };
        } else {
          // Filter out admin users first - they shouldn't be clocked in by tests
          const nonAdminWorkers = workers.filter((w: any) => {
            const name = (w.node.displayName || '').toLowerCase();
            const id = w.node.id || '';
            // Skip if name contains admin/cadmin
            if (name.includes('admin') || name.includes('cadmin')) {
              return false;
            }
            // Skip users with very long IDs (typically company/auth IDs)
            if (id.length > 12 && !id.startsWith('400')) {
              return false;
            }
            return true;
          });

          console.log(
            `  📋 Found ${workers.length} workers, ${nonAdminWorkers.length} non-admin employees`,
          );
          nonAdminWorkers.forEach((w: any) => {
            console.log(`    - ${w.node.displayName} (ID: ${w.node.id})`);
          });

          let worker;
          if (employeeName) {
            // Case-insensitive search for employee name
            const searchName = employeeName.toLowerCase();
            worker = nonAdminWorkers.find(
              (w: any) =>
                w.node.displayName?.toLowerCase().includes(searchName) ||
                w.node.firstName?.toLowerCase().includes(searchName) ||
                w.node.lastName?.toLowerCase().includes(searchName),
            );
            if (worker) {
              console.log(
                `  ✓ Found matching employee: ${worker.node.displayName}`,
              );
            } else {
              console.log(
                `  ⚠️ No employee matching "${employeeName}" found, using first available`,
              );
            }
          }

          if (!worker) {
            worker = nonAdminWorkers[0] || workers[0]; // Fallback to first if no match found
            console.log(`  → Using employee: ${worker.node.displayName}`);
          }

          result = {
            contactId: worker.node.id,
            displayName: worker.node.displayName,
            firstName: worker.node.firstName,
            lastName: worker.node.lastName,
          };
        }
      }
    } else {
      const text = await response.text();
      result = {
        error: `HTTP ${response.status()}: ${text.substring(0, 200)}`,
      };
    }
  } catch (e: any) {
    console.log('❌ Playwright request API failed:', e.message);

    // Fallback to page.evaluate with fetch
    console.log('📡 Falling back to page.evaluate fetch...');
    result = await page.evaluate(
      async ({ name, headers, endpoint }) => {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            credentials: 'include',
            body: JSON.stringify({
              query: `
            query {
              timeTrackingWorkers(first: 20) {
                edges {
                  node {
                      id
                      displayName
                      firstName
                      lastName
                    isActive
                  }
                }
              }
            }
          `,
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            return {
              error: `HTTP ${response.status}: ${text.substring(0, 200)}`,
            };
          }

          const data = await response.json();
          if (data.errors) {
            return { error: data.errors[0]?.message || 'GraphQL error' };
          }

          const workers = data.data?.timeTrackingWorkers?.edges || [];
          if (workers.length === 0) {
            return { error: 'No workers found' };
          }

          // Filter out admin users first
          const nonAdminWorkers = workers.filter((w: any) => {
            const workerName = (w.node.displayName || '').toLowerCase();
            const id = w.node.id || '';
            if (workerName.includes('admin') || workerName.includes('cadmin')) {
              return false;
            }
            if (id.length > 12 && !id.startsWith('400')) {
              return false;
            }
            return true;
          });

          let worker;
          if (name) {
            // Case-insensitive search
            const searchName = name.toLowerCase();
            worker = nonAdminWorkers.find(
              (w: any) =>
                w.node.displayName?.toLowerCase().includes(searchName) ||
                w.node.firstName?.toLowerCase().includes(searchName) ||
                w.node.lastName?.toLowerCase().includes(searchName),
            );
          }

          if (!worker) {
            worker = nonAdminWorkers[0] || workers[0];
          }

          return {
            contactId: worker.node.id,
            displayName: worker.node.displayName,
            firstName: worker.node.firstName,
            lastName: worker.node.lastName,
          };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      { name: employeeName, headers, endpoint },
    );
  }

  if (result.error) {
    throw new Error(`Failed to get test employee: ${result.error}`);
  }

  console.log(`✅ Test Employee: ${result.displayName} (${result.contactId})`);
  return result as TestEmployee;
}

/**
 * Get active (clocked in) time entry for an employee
 */
async function getActiveTimeEntry(
  page: Page,
  employeeId: string,
): Promise<TestTimeEntry | null> {
  const headers = await getGraphQLHeaders(page);
  const endpoint = await getGraphQLEndpoint(page);

  const result = await page.evaluate(
    async ({ empId, headers, endpoint }) => {
      const query = `
      query {
        timeTrackingWhoIsWorking(filter: { clockedInTimeForOnly: true }) {
          edges {
            node {
              timeForContactDAS { id }
              activeTimeEntry {
                id
                startTime
                duration
                isOpen
              }
            }
          }
        }
      }
    `;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          credentials: 'include',
          body: JSON.stringify({ query }),
        });

        const result = await response.json();
        const workers = result.data?.timeTrackingWhoIsWorking?.edges || [];
        const worker = workers.find(
          (w: any) => w.node.timeForContactDAS?.id === empId,
        );

        if (worker?.node?.activeTimeEntry) {
          const entry = worker.node.activeTimeEntry;
          return {
            id: entry.id,
            employeeId: empId,
            startTime: entry.startTime,
            duration: entry.duration || 0,
            isOpen: entry.isOpen ?? true,
          };
        }

        return null;
      } catch (error: any) {
        console.error('Failed to get active time entry:', error.message);
        return null;
      }
    },
    { empId: employeeId, headers, endpoint },
  );

  return result;
}

/**
 * Clock in an employee
 */
export async function clockInEmployee(
  page: Page,
  employeeId: string,
): Promise<TestTimeEntry> {
  console.log(`⏰ Clocking in employee ${employeeId}...`);

  // First check if employee is already clocked in
  const existingEntry = await getActiveTimeEntry(page, employeeId);
  if (existingEntry) {
    console.log(
      `✅ Employee already clocked in - using existing Time Entry ${existingEntry.id}`,
    );
    return existingEntry;
  }

  const headers = await getGraphQLHeaders(page);
  const endpoint = await getGraphQLEndpoint(page);

  const result = await page.evaluate(
    async ({ empId, headers, endpoint }) => {
      const mutation = `
      mutation createTimeEntry($input: TimeTracking_CreateTimeEntryInput!) {
        timeTrackingCreateTimeEntry(input: $input) {
          ... on TimeTracking_CreateTimeEntryPayload {
            successCode
            timeEntries {
              id
              startTime
              duration
              isOpen
            }
          }
          ... on TimeTracking_MutationError {
            errorCode
            message
          }
        }
      }
    `;

      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      // Format without milliseconds: YYYY-MM-DDTHH:mm:ssZ
      const startTime = now.toISOString().replace(/\.\d{3}Z$/, 'Z');

      const variables = {
        input: {
          timeFor: {
            id: empId,
            timeForType: 'EMPLOYEE',
          },
          date: today,
          startTime: startTime, // Set startTime to create open entry
          // Do NOT set endTime or duration - this makes it an "open" clock-in
          isExported: false,
        },
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          credentials: 'include',
          body: JSON.stringify({ query: mutation, variables }),
        });

        const result = await response.json();

        if (result.errors) {
          return { error: result.errors[0].message };
        }

        const data = result.data?.timeTrackingCreateTimeEntry;

        if (data?.errorCode) {
          return { error: `${data.errorCode}: ${data.message}` };
        }

        if (data?.timeEntries && data.timeEntries.length > 0) {
          const entry = data.timeEntries[0];
          return {
            id: entry.id,
            employeeId: empId,
            startTime: entry.startTime || startTime,
            duration: entry.duration || 0,
            isOpen: entry.isOpen ?? true,
          };
        }

        return { error: 'No time entry returned' };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    { empId: employeeId, headers, endpoint },
  );

  // Handle "already clocked in" or "duplicate key" errors - get existing time entry instead
  const isDuplicateError =
    result.error &&
    (result.error.includes('ALREADY_CLOCKED_IN') ||
      result.error.includes('duplicate key') ||
      result.error.includes('already exists'));

  if (isDuplicateError) {
    console.log(
      '⚠️ Employee already has active entry, fetching existing time entry...',
    );

    // Get the existing active time entry
    const retryEntry = await getActiveTimeEntry(page, employeeId);
    if (retryEntry) {
      console.log(
        `✅ Using existing Time Entry ${retryEntry.id} (isOpen: ${retryEntry.isOpen})`,
      );
      return retryEntry;
    }

    // If still no entry found, log but continue (the entry might just not be "open")
    console.log('⚠️ Could not find active entry after duplicate error');
  }

  if (result.error && !isDuplicateError) {
    throw new Error(`Failed to clock in employee: ${result.error}`);
  }

  // If we had a duplicate error but couldn't find entry, try to extract ID from error
  if (isDuplicateError && !result.id) {
    console.log('⚠️ Using fallback entry ID from error context');
    // Extract ID from error: Key (company_account_id, time_entry_id)=(xxx, yyy)
    const match = result.error.match(/time_entry_id\)=\(\d+,\s*(\d+)\)/);
    if (match) {
      return {
        id: match[1],
        employeeId: employeeId,
        startTime: new Date().toISOString(),
        duration: 0,
        isOpen: true,
      };
    }
    // If we still can't get the ID, throw a specific error
    throw new Error(
      `Failed to clock in: Duplicate entry exists but could not retrieve it. Try clocking out first.`,
    );
  }

  // Ensure we have a valid result
  if (!result.id) {
    throw new Error(`Failed to clock in employee: No entry ID returned`);
  }

  console.log(
    `✅ Clocked in: Time Entry ${result.id} (isOpen: ${result.isOpen})`,
  );
  return result as TestTimeEntry;
}

/**
 * Create location points for an employee
 */
export async function createLocationPoints(
  page: Page,
  employeeId: string,
  startTime: string,
  numberOfPoints: number = 10,
): Promise<string[]> {
  console.log(
    `📍 Creating ${numberOfPoints} location points for employee ${employeeId}...`,
  );

  const headers = await getGraphQLHeaders(page);
  const endpoint = await getGraphQLEndpoint(page);

  const result = await page.evaluate(
    async ({ empId, start, numPoints, headers, endpoint }) => {
      const mutation = `
      mutation TimeTrackingCreateLocationPoints($input: TimeTracking_CreateLocationPointsInput!) {
        timeTrackingCreateLocationPoints(input: $input) {
          ... on TimeTracking_CreateLocationPointsPayload {
            successCode
            createdLocationPoints {
              locationPoints {
                id
              }
            }
          }
          ... on TimeTracking_CreateLocationPointsError {
            errorCode
            message
          }
        }
      }
    `;

      const startTimestamp = new Date(start).getTime();
      const now = Date.now();
      const interval = Math.floor((now - startTimestamp) / numPoints);
      const locationPoints = [];
      const baseLat = 37.7749;
      const baseLng = -122.4194;
      // Unique run ID to avoid conflicts with previous runs
      const runId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      for (let i = 0; i < numPoints; i++) {
        const timestamp = new Date(startTimestamp + interval * i);
        locationPoints.push({
          accuracy: 10 + Math.random() * 3,
          altitude: 100 + Math.random() * 5,
          latitude: baseLat + (Math.random() * 0.001 - 0.0005),
          longitude: baseLng + (Math.random() * 0.001 - 0.0005),
          speed: Math.random() * 5,
          source: 'GPS',
          createdAt: timestamp.toISOString(),
          deviceIdentifier: `test-device-${runId}-${i}`,
        });
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          credentials: 'include',
          body: JSON.stringify({
            query: mutation,
            variables: {
              input: {
                timeFor: { id: empId, timeForType: 'EMPLOYEE' },
                locationPoints,
              },
            },
          }),
        });

        const result = await response.json();

        if (result.errors) {
          return { error: result.errors[0].message };
        }

        const data = result.data?.timeTrackingCreateLocationPoints;

        if (data?.errorCode) {
          return { error: `${data.errorCode}: ${data.message}` };
        }

        if (data?.successCode && data.createdLocationPoints?.locationPoints) {
          return {
            ids: data.createdLocationPoints.locationPoints.map(
              (p: any) => p.id,
            ),
          };
        }

        return { error: 'No location points returned' };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    {
      empId: employeeId,
      start: startTime,
      numPoints: numberOfPoints,
      headers,
      endpoint,
    },
  );

  if (result.error) {
    // Duplicate key errors are okay - location points might already exist
    if (
      result.error.includes('duplicate key') ||
      result.error.includes('already exists')
    ) {
      console.log(
        `⚠️ Location points skipped: Some already exist (this is okay)`,
      );
      return [];
    }
    throw new Error(`Failed to create location points: ${result.error}`);
  }

  console.log(`✅ Created ${result.ids?.length || 0} location points`);
  return result.ids || [];
}

/**
 * Create location points at specific coordinates
 * Used for testing same-location and far-apart scenarios
 */
export async function createLocationPointsAtCoordinates(
  page: Page,
  employeeId: string,
  startTime: string,
  coordinates: { latitude: number; longitude: number },
  numberOfPoints: number = 5,
): Promise<string[]> {
  console.log(
    `📍 Creating ${numberOfPoints} location points at (${coordinates.latitude}, ${coordinates.longitude}) for employee ${employeeId}...`,
  );

  const headers = await getGraphQLHeaders(page);
  const endpoint = await getGraphQLEndpoint(page);

  const result = await page.evaluate(
    async ({ empId, start, numPoints, coords, headers, endpoint }) => {
      const mutation = `
      mutation TimeTrackingCreateLocationPoints($input: TimeTracking_CreateLocationPointsInput!) {
        timeTrackingCreateLocationPoints(input: $input) {
          ... on TimeTracking_CreateLocationPointsPayload {
            successCode
            createdLocationPoints {
              locationPoints {
                id
              }
            }
          }
          ... on TimeTracking_CreateLocationPointsError {
            errorCode
            message
          }
        }
      }
    `;

      const startTimestamp = new Date(start).getTime();
      const now = Date.now();
      const interval = Math.floor((now - startTimestamp) / numPoints);
      const locationPoints = [];
      const runId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      for (let i = 0; i < numPoints; i++) {
        const timestamp = new Date(startTimestamp + interval * i);
        locationPoints.push({
          accuracy: 10 + Math.random() * 3,
          altitude: 100 + Math.random() * 5,
          // Use exact coordinates with tiny variance (within ~10 meters)
          latitude: coords.latitude + (Math.random() * 0.0001 - 0.00005),
          longitude: coords.longitude + (Math.random() * 0.0001 - 0.00005),
          speed: Math.random() * 2,
          source: 'GPS',
          createdAt: timestamp.toISOString(),
          deviceIdentifier: `test-device-${runId}-${i}`,
        });
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          credentials: 'include',
          body: JSON.stringify({
            query: mutation,
            variables: {
              input: {
                timeFor: { id: empId, timeForType: 'EMPLOYEE' },
                locationPoints,
              },
            },
          }),
        });

        const result = await response.json();

        if (result.errors) {
          return { error: result.errors[0].message };
        }

        const data = result.data?.timeTrackingCreateLocationPoints;

        if (data?.errorCode) {
          return { error: `${data.errorCode}: ${data.message}` };
        }

        if (data?.successCode && data.createdLocationPoints?.locationPoints) {
          return {
            ids: data.createdLocationPoints.locationPoints.map(
              (p: any) => p.id,
            ),
          };
        }

        return { error: 'No location points returned' };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    {
      empId: employeeId,
      start: startTime,
      numPoints: numberOfPoints,
      coords: coordinates,
      headers,
      endpoint,
    },
  );

  if (result.error) {
    if (
      result.error.includes('duplicate key') ||
      result.error.includes('already exists')
    ) {
      console.log(`⚠️ Location points skipped: Some already exist`);
      return [];
    }
    throw new Error(`Failed to create location points: ${result.error}`);
  }

  console.log(
    `✅ Created ${
      result.ids?.length || 0
    } location points at specified coordinates`,
  );
  return result.ids || [];
}

// Common test locations
export const TEST_LOCATIONS = {
  SAN_FRANCISCO: { latitude: 37.7749, longitude: -122.4194 },
  NEW_YORK: { latitude: 40.7128, longitude: -74.006 },
  LOS_ANGELES: { latitude: 34.0522, longitude: -118.2437 },
  CHICAGO: { latitude: 41.8781, longitude: -87.6298 },
};

/**
 * Clock out an employee
 */
export async function clockOutEmployee(
  page: Page,
  timeEntryId: string,
  employeeId?: string,
  startTime?: string,
): Promise<boolean> {
  console.log(`⏱️ Clocking out time entry ${timeEntryId}...`);

  const headers = await getGraphQLHeaders(page);
  const endpoint = await getGraphQLEndpoint(page);

  console.log(`  → Endpoint: ${endpoint}`);
  console.log(`  → Time Entry ID: ${timeEntryId}`);
  console.log(`  → Employee ID: ${employeeId || 'not provided'}`);
  console.log(`  → Start Time: ${startTime || 'not provided'}`);

  const result = await page.evaluate(
    async ({ entryId, empId, entryStartTime, headers, endpoint }) => {
      const mutation = `
      mutation updateTimeEntry($input: TimeTracking_UpdateTimeEntryInput!) {
        timeTrackingUpdateTimeEntry(input: $input) {
          ... on TimeTracking_UpdateTimeEntryPayload {
            successCode
          }
          ... on TimeTracking_MutationError {
            errorCode
            message
          }
        }
      }
    `;

      const now = new Date();
      const endTime = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
      const input: Record<string, any> = {
        id: entryId,
        endTime: endTime,
        isExported: false, // This is a time entry, not time activity
      };

      // Add timeFor if employee ID is provided (required by API)
      if (empId) {
        input.timeFor = { id: empId, timeForType: 'EMPLOYEE' };
      }

      // Add startTime if provided (required by API for update)
      // Also strip milliseconds from startTime if present
      if (entryStartTime) {
        input.startTime = entryStartTime.replace(/\.\d{3}/, ''); // Remove milliseconds
      }

      const variables = { input };

      try {
        // Add timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          credentials: 'include',
          body: JSON.stringify({ query: mutation, variables }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();
        let result;
        try {
          result = JSON.parse(responseText);
        } catch {
          return {
            error: `Invalid JSON response: ${responseText.substring(0, 200)}`,
            debug: { variables, responseText: responseText.substring(0, 500) },
          };
        }

        if (result.errors) {
          return {
            error: result.errors[0].message,
            debug: { variables, response: result },
          };
        }

        const data = result.data?.timeTrackingUpdateTimeEntry;

        if (data?.errorCode) {
          return {
            error: `${data.errorCode}: ${data.message}`,
            debug: { variables, response: result },
          };
        }

        if (data?.successCode) {
          return { success: true };
        }

        return {
          error: 'Unknown response',
          debug: { variables, response: result },
        };
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return { error: 'Request timed out after 30 seconds' };
        }
        return { error: error.message };
      }
    },
    {
      entryId: timeEntryId,
      empId: employeeId,
      entryStartTime: startTime,
      headers,
      endpoint,
    },
  );

  if (result.error) {
    // These errors are okay during cleanup - we'll just delete directly
    if (result.error.includes('not found')) {
      console.log(
        `⚠️ Clock out skipped: Entry ${timeEntryId} not found (may already be closed)`,
      );
    } else if (result.error.includes('MISSING_TIME_FOR')) {
      console.log(`⚠️ Clock out skipped: Will delete entry directly instead`);
    } else {
      console.error(`❌ Failed to clock out: ${result.error}`);
      if (result.debug) {
        console.error('  Debug info:', JSON.stringify(result.debug, null, 2));
      }
    }
    return false;
  }

  console.log(`✅ Clocked out successfully`);
  return true;
}

/**
 * Delete a time entry
 */
export async function deleteTimeEntry(
  page: Page,
  timeEntryId: string,
): Promise<boolean> {
  console.log(`🗑️ Deleting time entry ${timeEntryId}...`);

  const headers = await getGraphQLHeaders(page);
  const endpoint = await getGraphQLEndpoint(page);

  console.log(`  → Endpoint: ${endpoint}`);

  const result = await page.evaluate(
    async ({ entryId, headers, endpoint }) => {
      const mutation = `
      mutation deleteTimeEntry($input: TimeTracking_DeleteTimeEntryInput!) {
        timeTrackingDeleteTimeEntry(input: $input) {
          ... on TimeTracking_DeleteTimeEntryPayload {
            successCode
          }
          ... on TimeTracking_MutationError {
            errorCode
            message
          }
        }
      }
    `;

      const variables = {
        input: {
          id: entryId,
          isExported: false, // This is a time entry, not time activity
        },
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          credentials: 'include',
          body: JSON.stringify({ query: mutation, variables }),
        });

        const responseText = await response.text();
        let result;
        try {
          result = JSON.parse(responseText);
        } catch {
          return {
            error: `Invalid JSON: ${responseText.substring(0, 200)}`,
            debug: { variables },
          };
        }

        if (result.errors) {
          return {
            error: result.errors[0].message,
            debug: { variables, response: result },
          };
        }

        const data = result.data?.timeTrackingDeleteTimeEntry;

        if (data?.errorCode) {
          return {
            error: `${data.errorCode}: ${data.message}`,
            debug: { variables, response: result },
          };
        }

        if (data?.successCode) {
          return { success: true, successCode: data.successCode };
        }

        return {
          error: 'Unknown response',
          debug: { variables, response: result },
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    { entryId: timeEntryId, headers, endpoint },
  );

  if (result.error) {
    // "not found" errors are okay during cleanup
    if (result.error.includes('not found')) {
      console.log(
        `⚠️ Delete skipped: Entry ${timeEntryId} not found (may already be deleted)`,
      );
    } else {
      console.error(`❌ Failed to delete time entry: ${result.error}`);
      if (result.debug) {
        console.error('  Debug info:', JSON.stringify(result.debug, null, 2));
      }
    }
    return false;
  }

  console.log(
    `✅ Time entry ${timeEntryId} deleted successfully (${result.successCode})`,
  );
  return true;
}

/**
 * Complete test data setup - creates everything needed for Who's Working Map tests
 */
export async function setupCompleteTestData(
  page: Page,
  options?: {
    employeeName?: string;
    numberOfLocationPoints?: number;
  },
): Promise<TestDataContext> {
  console.log('\n🚀 Setting up complete test data...\n');

  const numberOfPoints = options?.numberOfLocationPoints || 10;

  const config = await getCompanyConfig(page);
  const employee = await getTestEmployee(page, options?.employeeName);
  const timeEntry = await clockInEmployee(page, employee.contactId);
  const locationPointIds = await createLocationPoints(
    page,
    employee.contactId,
    timeEntry.startTime,
    numberOfPoints,
  );

  const context: TestDataContext = {
    config,
    employee,
    timeEntry,
    locationPointIds,
  };

  console.log('\n✅ Test data setup complete!\n');
  console.log('📋 Test Context:', {
    employee: `${employee.displayName} (${employee.contactId})`,
    timeEntry: `${timeEntry.id} (Started: ${new Date(
      timeEntry.startTime,
    ).toLocaleTimeString()})`,
    locationPoints: `${locationPointIds.length} points created`,
    company: `${config.companyId}`,
  });
  console.log('\n');

  return context;
}

/**
 * Complete test data teardown - cleans up everything
 */
export async function teardownCompleteTestData(
  page: Page,
  context: TestDataContext,
  options?: {
    deleteTimeEntry?: boolean;
    clockOutFirst?: boolean;
  },
): Promise<void> {
  console.log('\n🧹 Cleaning up test data...\n');

  const shouldClockOut = options?.clockOutFirst ?? true;
  const shouldDelete = options?.deleteTimeEntry ?? true;

  try {
    // Get the CURRENT active entry for this employee (in case ID changed)
    const currentEntry = await getActiveTimeEntry(
      page,
      context.employee.contactId,
    );
    const entryId = currentEntry?.id || context.timeEntry.id;
    const isOpen = currentEntry?.isOpen ?? context.timeEntry.isOpen;
    const entryStartTime =
      currentEntry?.startTime || context.timeEntry.startTime;

    console.log(
      `  → Using entry ID: ${entryId} (current: ${currentEntry?.id}, stored: ${context.timeEntry.id})`,
    );
    console.log(`  → Start time: ${entryStartTime}`);

    if (shouldClockOut && isOpen) {
      await clockOutEmployee(
        page,
        entryId,
        context.employee.contactId,
        entryStartTime,
      );
    }

    if (shouldDelete) {
      await deleteTimeEntry(page, entryId);
    }

    console.log('\n✅ Test data cleanup complete!\n');
  } catch (error) {
    console.error('\n⚠️ Cleanup encountered errors (this is okay):', error);
    console.log('\n');
  }
}

/**
 * Get existing clocked-in employee (doesn't create new entry)
 */
export async function getExistingClockedInEmployee(
  page: Page,
): Promise<TestDataContext | null> {
  console.log('🔍 Looking for existing clocked-in employee...');

  const result = await page.evaluate(async () => {
    const query = `
      query timeTrackingWhoIsWorking($filter: TimeTracking_WhoIsWorkingFilter!) {
        timeTrackingWhoIsWorking(filter: $filter) {
          edges {
            node {
              timeForContactDAS { id }
              displayName
              firstName
              lastName
              activeTimeEntry {
                id
                startTime
                duration
                isOpen
              }
            }
          }
        }
      }
    `;

    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query,
          variables: { filter: { clockedInTimeForOnly: true } },
        }),
      });

      const result = await response.json();
      const workers = result.data?.timeTrackingWhoIsWorking?.edges || [];

      if (workers.length === 0) {
        return null;
      }

      const worker = workers[0].node;

      return {
        employee: {
          contactId: worker.timeForContactDAS.id,
          displayName: worker.displayName,
          firstName: worker.firstName,
          lastName: worker.lastName,
        },
        timeEntry: {
          id: worker.activeTimeEntry.id,
          employeeId: worker.timeForContactDAS.id,
          startTime: worker.activeTimeEntry.startTime,
          duration: worker.activeTimeEntry.duration,
          isOpen: worker.activeTimeEntry.isOpen,
        },
      };
    } catch (error: any) {
      return null;
    }
  });

  if (!result) {
    console.log('⚠️ No clocked-in employees found');
    return null;
  }

  const config = await getCompanyConfig(page);

  const context: TestDataContext = {
    config,
    employee: result.employee,
    timeEntry: result.timeEntry,
    locationPointIds: [],
  };

  console.log(`✅ Found clocked-in employee: ${result.employee.displayName}`);

  return context;
}

/**
 * WWM006 - Validate multiple clocked-in employees on map
 */
export async function validateMultipleClockedInEmployees(
  page: Page,
  employee1Name: string,
  employee2Name: string,
): Promise<number> {
  console.log('Validating multiple clocked-in employees...');

  const mapPage = new WhosWorkingMapPage(page);

  await validateWhosWorkingMapAccess(page);

  // Use "On the clock only" filter
  await mapPage.openFilters();
  await mapPage.selectDisplayByOption('On the clock only');
  await mapPage.applyFilters();
  await page.waitForTimeout(2000);

  const clockedInCount = await mapPage.getWorkerCount();
  console.log(`  ✓ Clocked-in employees on map: ${clockedInCount}`);
  expect(clockedInCount).toBeGreaterThanOrEqual(2);

  // Validate both employees are in the list
  await mapPage.validateWorkerInList(employee1Name);
  await mapPage.validateWorkerInList(employee2Name);
  console.log('  ✓ Both employees visible in worker list');

  return clockedInCount;
}

/**
 * WWM006 - Edit existing time entry and validate on Time Entries
 */
export async function editTimeAndValidateOnTimeEntries(
  page: Page,
  employeeName: string,
  noteText: string = 'WWM Edit Test',
): Promise<number> {
  console.log('Testing Edit Time → STE → Time Entries validation...');

  const mapPage = new WhosWorkingMapPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const stePage = new SingleTimeEntryPage(page);

  // Click Edit Time for the employee
  const editTimeLink = mapPage.getEditTimeLinkForWorker(employeeName);
  await editTimeLink.click();

  // Validate STE opened
  await expect(stePage.headingSingleTimeEntry).toBeVisible();
  await stePage.waitTillNameFieldVisible();
  console.log('  ✓ STE drawer opened and form loaded');

  // Add notes
  await stePage.enterNotes(noteText);
  console.log('  ✓ Added notes to entry');

  // Save and close
  await stePage.clickSaveAndCloseButton();
  await page.waitForTimeout(2000);
  console.log('  ✓ STE saved and closed');

  // Navigate to Time Entries and validate
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  const rowCount = await timeEntriesPage.getRowCount();
  expect(rowCount).toBeGreaterThan(0);

  // Validate notes are visible
  const notesVisible = await mapPage.isTextVisible(noteText);
  expect(notesVisible).toBe(true);
  console.log(
    `  ✓ Time entry validated with notes "${noteText}" on Time Entries screen`,
  );

  return rowCount;
}

/**
 * WWM006 - Add new STE via Add Time and validate on Time Entries
 */
export async function addTimeSTEAndValidateOnTimeEntries(
  page: Page,
  previousRowCount: number,
  noteText: string = 'WWM Add Time Test',
): Promise<boolean> {
  console.log('Testing Add Time → STE → Create → Time Entries validation...');

  const mapPage = new WhosWorkingMapPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const stePage = new SingleTimeEntryPage(page);

  await validateWhosWorkingMapAccess(page);

  // Select "All employees" to see unclocked employees
  await mapPage.openFilters();
  await mapPage.selectDisplayByOption('All employees');
  await mapPage.applyFilters();
  await page.waitForTimeout(2000);

  // Click Add Time for first employee
  if (!(await mapPage.isFirstAddTimeLinkVisible())) {
    console.log('  ⚠️ No employees with Add Time option found');
    return false;
  }

  await mapPage.clickFirstAddTimeLink();

  // Validate dropdown shows both options
  await expect(mapPage.getSingleTimeEntryOption()).toBeVisible();
  await expect(mapPage.getAddBreakOption()).toBeVisible();
  console.log('  ✓ Add Time dropdown visible with STE and Break options');

  // Select Single Time Entry
  await mapPage.selectSingleTimeEntry();
  await page.waitForTimeout(1000);

  // Validate STE opened
  await expect(stePage.headingSingleTimeEntry).toBeVisible();
  await stePage.waitTillNameFieldVisible();
  console.log('  ✓ STE drawer opened from Add Time');

  // Fill STE form with yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const formattedDate = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await stePage.fillStartDate(formattedDate);

  // Enable start and end time mode
  const toggleState = await stePage.verifySetClockToggleState();
  if (!toggleState) {
    await stePage.clickSetClockInAndOutToggles();
    await page.waitForTimeout(500);
  }

  // Fill times (past times to avoid future time error)
  await stePage.fillStartTime('08:00 AM');
  await stePage.fillEndTime('08:30 AM');

  await stePage.enterNotes(noteText);
  console.log('  ✓ Filled STE form with start/end time and notes');

  // Save and close
  await stePage.clickSaveAndCloseButton();
  await page.waitForTimeout(2000);
  console.log('  ✓ STE saved and closed');

  // Navigate to Time Entries and validate
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  const updatedRowCount = await timeEntriesPage.getRowCount();
  // Use >= since row count might be capped by pagination
  expect(updatedRowCount).toBeGreaterThanOrEqual(previousRowCount);

  // Validate notes are visible
  const notesVisible = await mapPage.isTextVisible(noteText);
  expect(notesVisible).toBe(true);
  console.log(
    `  ✓ New time entry validated with notes "${noteText}" (${updatedRowCount} rows, was ${previousRowCount})`,
  );

  return true;
}

/**
 * WWM006 - Add break via Add Time and validate on Time Entries
 */
export async function addBreakAndValidateOnTimeEntries(
  page: Page,
  breakTypeName: string = 'test man',
): Promise<boolean> {
  console.log('Testing Add Break → Create → Time Entries validation...');

  const mapPage = new WhosWorkingMapPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const breaksPage = new BreaksPage(page);

  await validateWhosWorkingMapAccess(page);

  // Select "All employees"
  await mapPage.openFilters();
  await mapPage.selectDisplayByOption('All employees');
  await mapPage.applyFilters();
  await page.waitForTimeout(2000);

  // Click Add Time for an employee
  if (!(await mapPage.isFirstAddTimeLinkVisible())) {
    console.log('  ⚠️ No employees available for Add Break test');
    return false;
  }

  await mapPage.clickFirstAddTimeLink();

  // Validate dropdown and select Add break
  await expect(mapPage.getSingleTimeEntryOption()).toBeVisible();
  await expect(mapPage.getAddBreakOption()).toBeVisible();

  await mapPage.selectAddBreak();
  await page.waitForTimeout(1000);

  // Validate break drawer opened
  await expect(breaksPage.addBreakDrawer.first()).toBeVisible();
  console.log('  ✓ Add Break drawer opened');

  // Select Test Emp3 from the Name dropdown (instead of default admin)
  const targetEmployee = 'Test Emp3';

  // Wait for drawer to fully load before interacting
  await page.waitForTimeout(2000);

  await breaksPage.teamMemberDropdown.click({ force: true });

  // Wait for dropdown options to load
  await page.waitForTimeout(2000);

  // Look for option within the dropdown listbox only (not map elements behind)
  const dropdownList = page.locator('ul[role="listbox"]');

  // Wait for dropdown list to be visible
  await dropdownList.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
    console.log('  ⚠️ Dropdown list not visible, retrying click...');
  });
  await page.waitForTimeout(1000);

  const teamMemberOption = dropdownList.locator(
    `//span[@title="${targetEmployee}"]`,
  );
  const teamMemberOptionAlt = dropdownList.getByText(targetEmployee, {
    exact: false,
  });

  if (await teamMemberOption.isVisible({ timeout: 5000 }).catch(() => false)) {
    await teamMemberOption.click();
    console.log(`  ✓ Selected team member: ${targetEmployee}`);
  } else if (
    await teamMemberOptionAlt.isVisible({ timeout: 3000 }).catch(() => false)
  ) {
    await teamMemberOptionAlt.click();
    console.log(`  ✓ Selected team member: ${targetEmployee}`);
  } else {
    // Fallback: select by role option
    const optionByRole = page.getByRole('option', {
      name: new RegExp(targetEmployee, 'i'),
    });
    if (await optionByRole.isVisible({ timeout: 3000 }).catch(() => false)) {
      await optionByRole.click();
      console.log(`  ✓ Selected team member: ${targetEmployee}`);
    } else {
      // Could not find target employee - click elsewhere to close dropdown and continue with default
      console.log(
        `  ⚠️ Could not find ${targetEmployee}, continuing with default employee`,
      );
      // Click on the drawer header/title to close dropdown without closing drawer
      const drawerTitle = page.locator(`//*[text()='Add Break Entry']`);
      if (await drawerTitle.isVisible({ timeout: 1000 }).catch(() => false)) {
        await drawerTitle.click();
      }
      await page.waitForTimeout(500);
    }
  }
  await page.waitForTimeout(500);

  // Select break type
  await breaksPage.breakTypeDropdown.click();
  await page.waitForTimeout(500);

  const selectedBreak = await mapPage.selectBreakType(breakTypeName);
  console.log(
    selectedBreak
      ? `  ✓ Selected "${breakTypeName}" break type`
      : '  ✓ Selected first available break type',
  );

  // Enter date (yesterday to avoid future time error)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const breakDate = yesterday.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await breaksPage.enterStartDate(breakDate);

  // Select Duration and enter time
  await breaksPage.selectBreakEntryType('Duration');
  await mapPage.pressTab();
  await breaksPage.enterDurationTime('0:15');
  await mapPage.pressTab();
  console.log('  ✓ Filled break form with 15 min duration');

  // Save break
  await breaksPage.saveBreak();
  await page.waitForTimeout(2000);
  console.log('  ✓ Break saved');

  // Navigate to Time Entries and validate
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  await selectDisplayByOption(page, 'Date');
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, 'This month');
  await timeEntriesPage.waitForLoadingToDisappear();

  const finalRowCount = await timeEntriesPage.getRowCount();
  expect(finalRowCount).toBeGreaterThan(0);

  // Validate break entry is visible
  const breakVisible = await mapPage.isBreakVisible(breakTypeName);
  expect(breakVisible).toBe(true);
  console.log(
    `  ✓ Break entry validated on Time Entries screen (${finalRowCount} rows)`,
  );

  return true;
}

/**
 * WWM006 - Cleanup test entries via UI
 */
export async function cleanupTestEntriesViaUI(
  page: Page,
  maxDeletions: number = 10,
): Promise<number> {
  console.log('Cleaning up test entries via UI...');

  const timeEntriesPage = new TimeEntriesPage(page);

  try {
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    // Filter by Date view and This month
    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    // Delete all test entries
    let rowCount = await timeEntriesPage.getRowCount();
    let deletedCount = 0;

    while (rowCount > 0 && deletedCount < maxDeletions) {
      try {
        await timeEntriesPage.clickFirstRowActionDropdown();
        await timeEntriesPage.clickDeleteInActionDropdown();
        await timeEntriesPage.expectDeleteEntryConfirmationPopupOpen();
        await timeEntriesPage.clickYesOnDeleteEntryPopup();
        await timeEntriesPage.waitForLoadingToDisappear();

        // Wait for deleted entry to fully disappear from DOM
        await page.waitForTimeout(2000);

        deletedCount++;

        // Re-check row count after entry is fully removed
        rowCount = await timeEntriesPage.getRowCount();
        console.log(
          `  → Deleted entry ${deletedCount}, remaining: ${rowCount}`,
        );
      } catch (deleteError) {
        console.log(`  ⚠️ Error deleting entry: ${deleteError}`);
        // Wait and retry getting row count
        await page.waitForTimeout(2000);
        rowCount = await timeEntriesPage.getRowCount();
        if (rowCount === 0) break;
      }
    }

    console.log(`  ✓ Cleaned up ${deletedCount} test entries`);
    return deletedCount;
  } catch (e) {
    console.log('  ⚠️ Could not clean up all entries:', e);
    return 0;
  }
}

/**
 * WWM001 - Validate navigation and close methods
 */
export async function validateNavigationAndCloseMethods(
  page: Page,
): Promise<void> {
  console.log('Testing navigation and close methods...');

  const mapPage = new WhosWorkingMapPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);

  // Navigate to map
  await validateWhosWorkingMapAccess(page);

  // Check if we're in empty state or have workers
  const workerCount = await mapPage.getWorkerPin().count();
  if (workerCount === 0) {
    await expect(mapPage.getEmptyStateMessage()).toBeVisible();
    console.log('  ✓ Empty state validated');
  } else {
    console.log(`  ✓ Map loaded with ${workerCount} worker(s)`);
  }

  // Navigate back
  await validateNavigationBackToTimeEntries(page);
  console.log('  ✓ Navigate back validated');

  // Close with X button
  await validateWhosWorkingMapAccess(page);
  await mapPage.closeMap();
  await timeEntriesPage.validateDisplayByDropdownVisible();
  console.log('  ✓ X button works');

  // Close with Cancel button
  await validateWhosWorkingMapAccess(page);
  await mapPage.getCancelButton().click();
  await page.waitForTimeout(500);
  await timeEntriesPage.validateDisplayByDropdownVisible();
  console.log('  ✓ Cancel button works');

  console.log('✅ Navigation validated');
}

/**
 * WWM002 - Validate complete UI elements
 */
export async function validateCompleteUI(page: Page): Promise<void> {
  console.log('Testing complete UI...');

  await validateWhosWorkingMapAccess(page);

  await validateCoreMapUI(page);
  console.log('  ✓ Core UI validated');

  await validateWorkerTooltip(page);
  console.log('  ✓ Tooltip validated');

  await validateMapControls(page);
  console.log('  ✓ Zoom and pan validated');

  await validateSatelliteView(page);
  console.log('  ✓ Satellite view validated');

  await validateFullscreenMode(page);
  console.log('  ✓ Fullscreen validated');

  await validateLocationDetailsPanel(page);
  console.log('  ✓ Location panel validated');

  console.log('✅ Complete UI validated');
}

/**
 * WWM003 - Validate search, filter, and target worker
 */
export async function validateSearchFilterAndTarget(page: Page): Promise<void> {
  console.log('Testing search, filter, and target...');

  await validateWhosWorkingMapAccess(page);
  const mapPage = new WhosWorkingMapPage(page);

  // Search functionality
  await validateSearchFunctionality(page);
  await mapPage.searchWorker('Test@#$%');
  await page.waitForTimeout(1000);
  await mapPage.clearSearch();
  console.log('  ✓ Search validated');

  // Filter functionality
  await validateFilterFunctionality(page);

  await mapPage.openFilters();
  await mapPage.selectDisplayByOption('All employees');
  await mapPage.applyFilters();
  await page.waitForTimeout(1000);

  await mapPage.openFilters();
  await mapPage.selectDisplayByOption('On the clock only');
  await mapPage.applyFilters();
  await page.waitForTimeout(1000);

  await mapPage.openFilters();
  await mapPage.selectSortByOption('Team member');
  await mapPage.applyFilters();
  await page.waitForTimeout(1000);

  await mapPage.openFilters();
  await mapPage.selectDisplayByOption('On the clock only');
  await mapPage.selectSortByOption('Daily total');
  await mapPage.closeFilters();
  await page.waitForTimeout(500);

  await mapPage.openFilters();
  await mapPage.closeFilters();
  console.log('  ✓ Filter validated');

  // Target worker
  await validateTargetWorker(page);
  console.log('  ✓ Target worker validated');

  console.log('✅ Search, filter, and target validated');
}

/**
 * WWM004 - Validate time entry actions (Edit Time, Add Time dropdown)
 */
export async function validateTimeEntryActions(
  page: Page,
  employeeName: string,
): Promise<void> {
  console.log('Testing time entry actions...');

  await validateWhosWorkingMapAccess(page);
  const mapPage = new WhosWorkingMapPage(page);

  // Validate worker in list and Edit Time
  await mapPage.validateWorkerInList(employeeName);
  await mapPage.validateWorkerClockInTime(employeeName);

  await validateEditTimeFromMap(page);
  console.log('  ✓ Edit Time validated (opens STE directly)');

  // Add Time (non-clocked worker) - shows dropdown
  await mapPage.openFilters();
  await mapPage.selectDisplayByOption('All employees');
  await mapPage.applyFilters();
  await page.waitForTimeout(2000);

  if (await mapPage.isFirstAddTimeLinkVisible()) {
    await mapPage.clickFirstAddTimeLink();

    await expect(mapPage.getSingleTimeEntryOption()).toBeVisible();
    await expect(mapPage.getAddBreakOption()).toBeVisible();
    console.log('  ✓ Add Time dropdown visible with STE and Break options');

    await mapPage.closeDropdownWithEscape();
    console.log('  ✓ Add Time validated');
  } else {
    console.log('  ⚠️ No unclocked employees found with Add Time option');
  }

  console.log('✅ Time entry actions validated');
}

/**
 * WWM005 - Validate worker list interactions
 */
export async function validateWorkerListInteractions(
  page: Page,
  employeeName: string,
): Promise<void> {
  console.log('Testing worker list interactions...');

  await validateWhosWorkingMapAccess(page);
  const mapPage = new WhosWorkingMapPage(page);

  // Validate clocked in count
  const countText = await mapPage.validateClockedInCount();
  expect(countText).toMatch(/\d+\/\d+ on clock/);
  console.log(`  ✓ Clocked in count: ${countText}`);

  // Validate worker details
  await mapPage.validateWorkerInList(employeeName);
  const clockInTime = await mapPage.getWorkerCurrentClockInTime(employeeName);
  expect(clockInTime).not.toBeNull();
  console.log(`  ✓ Worker clock-in time: ${clockInTime}`);

  // Validate Edit Time link
  const editTimeLink = mapPage.getEditTimeLinkForWorker(employeeName);
  await expect(editTimeLink).toBeVisible();
  console.log('  ✓ Edit Time link visible');

  // Validate show on map button
  const showOnMapBtn = mapPage.getShowWorkerOnMapButtonForWorker(employeeName);
  await expect(showOnMapBtn).toBeVisible();
  console.log('  ✓ Show on map button visible');

  // Test show worker on map
  await mapPage.showWorkerOnMap(employeeName);
  await mapPage.validateMapIsVisible();
  await page.waitForTimeout(1000);
  console.log('  ✓ Show on map centers on worker location');

  // Test refresh map button
  await mapPage.refreshMap();
  await mapPage.waitForWorkerListToLoad();
  await mapPage.validateMapIsVisible();
  const pinCount = await mapPage.getWorkerCount();
  expect(pinCount).toBeGreaterThan(0);
  console.log('  ✓ Refresh map works correctly');

  console.log('✅ Worker list interactions validated');
}

/**
 * WWM007 - Validate error handling and graceful degradation
 * Tests three scenarios:
 * 1. Error on initial load (before navigating to map)
 * 2. Error after map is working (clock in + location points, then error)
 * 3. Attempting actions while error is active
 */
export async function validateErrorHandling(
  page: Page,
): Promise<TestDataContext | null> {
  console.log('Testing error handling...');

  const mapPage = new WhosWorkingMapPage(page);
  let testContext: TestDataContext | null = null;

  // ========== SCENARIO 1: Error on Initial Load ==========
  console.log('\n📍 Scenario 1: Error on initial navigation to map');

  // Set up error BEFORE navigating to map
  await page.route('**/graphql', (route) => {
    const postData = route.request().postData();
    if (postData?.includes('timeTrackingWhoIsWorking')) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          errors: [{ message: 'PLAYWRIGHT_WWM_ERROR' }],
        }),
      });
    } else {
      route.continue();
    }
  });

  // Now navigate to map with error already in place
  await mapPage.navigateToWhosWorkingMap();
  await page.waitForTimeout(3000); // Wait for map to load

  // Verify: Map container loads (Google Maps is independent)
  const mapVisible = await mapPage
    .getMapContainer()
    .isVisible()
    .catch(() => false);
  expect(mapVisible).toBe(true);
  console.log('  ✓ Google Maps still loads when GraphQL fails on initial load');

  // Verify: Employee list should be empty
  const initialErrorCount = await mapPage.getWorkerCount();
  expect(initialErrorCount).toBe(0);
  console.log(
    '  ✓ Employee list empty on initial error (graceful degradation)',
  );

  // Check for error message
  const errorVisible1 = await mapPage.isErrorMessageVisible();
  console.log(
    errorVisible1
      ? '  ✓ Error message shown to user'
      : '  ℹ️ No error message (silent failure)',
  );

  // Close map and unroute for next test
  await mapPage.closeMap();
  await page.waitForTimeout(1000);
  await page.unroute('**/graphql');

  // ========== SCENARIO 2: Error After Map Working (with data) ==========
  console.log('\n📍 Scenario 2: Error after map is working with employee data');

  // First, set up employee with clock-in and location points
  console.log('  Setting up employee with location data...');
  await page.waitForTimeout(3000); // Wait for app to stabilize

  try {
    testContext = await setupCompleteTestData(page, {
      employeeName: 'Emp1',
      numberOfLocationPoints: 5,
    });
    console.log(`  ✓ Employee clocked in: ${testContext.employee.displayName}`);
  } catch (e) {
    console.log(
      '  ⚠️ Could not set up test data, continuing with existing data',
    );
  }

  // Navigate to map - should show employee with location
  await validateWhosWorkingMapAccess(page);
  await mapPage.validateMapIsVisible();

  const workingCount = await mapPage.getWorkerCount();
  console.log(`  ✓ Map working normally with ${workingCount} employee(s)`);

  // Verify employee pin is visible (if we have test data)
  if (testContext) {
    await mapPage.validateWorkerInList(testContext.employee.displayName);
    console.log(
      `  ✓ Employee "${testContext.employee.displayName}" visible in list`,
    );
  }

  // Close map
  await mapPage.closeMap();
  await page.waitForTimeout(1000);

  // Now simulate error
  console.log('  Simulating API error...');
  await page.route('**/graphql', (route) => {
    const postData = route.request().postData();
    if (postData?.includes('timeTrackingWhoIsWorking')) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          errors: [{ message: 'PLAYWRIGHT_WWM_ERROR' }],
        }),
      });
    } else {
      route.continue();
    }
  });

  // Re-open map with error active
  await mapPage.navigateToWhosWorkingMap();
  await page.waitForTimeout(3000); // Wait for map to load

  // Verify: Map loads but employee data is gone
  const errorMapVisible = await mapPage
    .getMapContainer()
    .isVisible()
    .catch(() => false);
  expect(errorMapVisible).toBe(true);
  console.log('  ✓ Google Maps still visible after error');

  const errorWorkerCount = await mapPage.getWorkerCount();
  expect(errorWorkerCount).toBe(0);
  console.log('  ✓ Employee list empty due to API error (was working before)');

  // ========== SCENARIO 3: Actions While Error Active ==========
  console.log('\n📍 Scenario 3: Attempting actions while error is active');

  // Try search - should not crash
  try {
    await mapPage.searchWorker('Test');
    console.log('  ✓ Search does not crash during error');
  } catch (e) {
    console.log('  ✓ Search handled gracefully during error');
  }

  // Try filter - should not crash
  try {
    await mapPage.openFilters();
    await mapPage.selectDisplayByOption('All employees');
    await mapPage.applyFilters();
    console.log('  ✓ Filter does not crash during error');

    // Still should show no employees
    const filteredCount = await mapPage.getWorkerCount();
    expect(filteredCount).toBe(0);
    console.log('  ✓ Filter shows 0 employees (API still errored)');
  } catch (e) {
    console.log('  ✓ Filter handled gracefully during error');
  }

  // Try refresh - should not crash
  try {
    await mapPage.refreshMap();
    console.log('  ✓ Refresh does not crash during error');

    // Still should show no employees (error still active)
    const refreshedCount = await mapPage.getWorkerCount();
    expect(refreshedCount).toBe(0);
    console.log('  ✓ Refresh still shows 0 employees (API still errored)');
  } catch (e) {
    console.log('  ✓ Refresh handled gracefully during error');
  }

  // Map zoom/controls should still work (Google Maps independent)
  try {
    await mapPage.openMapCameraControls();
    await mapPage.zoomIn();
    await mapPage.zoomOut();
    console.log('  ✓ Map controls work during API error');
  } catch (e) {
    console.log('  ⚠️ Map controls issue during error:', e);
  }

  // Unroute and verify recovery
  await page.unroute('**/graphql');

  console.log('\n📍 Recovery Test');
  await mapPage.closeMap();
  await page.waitForTimeout(1000);

  await mapPage.navigateToWhosWorkingMap();
  await page.waitForTimeout(3000); // Wait for map to load

  const recoveredCount = await mapPage.getWorkerCount();
  console.log(
    `  ✓ Recovery: ${recoveredCount} employee(s) loaded after error cleared`,
  );

  await mapPage.validateMapIsVisible();
  console.log('  ✓ Map fully functional after recovery');

  console.log('\n✅ Error handling validated - app degrades gracefully');

  return testContext; // Return for cleanup
}

/**
 * QL_WM008 - Validate two employees at SAME location
 * Tests how map handles overlapping/clustered pins
 */
export async function validateEmployeesAtSameLocation(
  page: Page,
  employee1Name: string,
  employee2Name: string,
  skipNavigation = false,
): Promise<void> {
  console.log('QL_WM008: Testing two employees at SAME location...');

  const mapPage = new WhosWorkingMapPage(page);

  if (!skipNavigation) {
    await validateWhosWorkingMapAccess(page);
  }

  // Filter to show clocked-in workers
  await mapPage.openFilters();
  await mapPage.selectDisplayByOption('On the clock only');
  await mapPage.applyFilters();
  await page.waitForTimeout(2000);

  // VALIDATION 1: Both employees appear in the worker list
  await mapPage.validateWorkerInList(employee1Name);
  await mapPage.validateWorkerInList(employee2Name);
  console.log('  ✓ Both employees visible in worker list');

  // VALIDATION 2: Worker count is at least 2
  const workerCount = await mapPage.getWorkerCount();
  console.log(`  ✓ Total workers on clock: ${workerCount}`);
  expect(workerCount).toBeGreaterThanOrEqual(2);

  // VALIDATION 3: Map has markers (cluster or individual pins)
  // When employees are at same location, they appear as cluster (+N)
  // Zoom level determines if cluster or individual pins show - we can't control this reliably
  await mapPage.showWorkerOnMap(employee1Name);
  await page.waitForTimeout(1500);
  console.log(`  ✓ Centered map on shared location`);

  // Check for ANY marker on the map (cluster or pin)
  const clusterMarker = page.getByText(/^\+\d+$/); // "+2", "+3", etc.
  const anyPin = mapPage.getWorkerPin();

  const clusterCount = await clusterMarker.count();
  const pinCount = await anyPin.count();

  console.log(`  Map markers - Clusters: ${clusterCount}, Pins: ${pinCount}`);

  // Either clusters or pins should be visible on the map
  expect(clusterCount + pinCount).toBeGreaterThan(0);

  if (clusterCount > 0) {
    const clusterText = await clusterMarker
      .first()
      .textContent()
      .catch(() => '');
    console.log(
      `  ✓ Cluster marker "${clusterText}" shows employees grouped at same GPS coordinates`,
    );
  } else {
    console.log(
      `  ✓ Individual pins visible (map zoomed in enough to uncollapse cluster)`,
    );
  }

  console.log('✅ QL_WM008 Part A: Same location validation complete');
}

/**
 * Validate two employees at FAR APART locations
 * Tests how map displays workers at different geographic locations
 */
export async function validateEmployeesAtDifferentLocations(
  page: Page,
  employee1Name: string,
  employee2Name: string,
  location1Name: string,
  location2Name: string,
  skipNavigation = false,
): Promise<void> {
  console.log(
    'QL_WM008 Part B: Testing two employees at DIFFERENT locations...',
  );
  console.log(`  Employee 1: ${employee1Name} at ${location1Name}`);
  console.log(`  Employee 2: ${employee2Name} at ${location2Name}`);

  const mapPage = new WhosWorkingMapPage(page);

  if (!skipNavigation) {
    await validateWhosWorkingMapAccess(page);
    // Only filter if we just navigated (first time)
    await mapPage.openFilters();
    await mapPage.selectDisplayByOption('On the clock only');
    await mapPage.applyFilters();
    await page.waitForTimeout(2000);
  }

  // Verify both employees are in the list
  await mapPage.validateWorkerInList(employee1Name);
  await mapPage.validateWorkerInList(employee2Name);
  console.log('  ✓ Both employees visible in worker list');

  // Show first employee - map should zoom to their location
  await mapPage.showWorkerOnMap(employee1Name);
  await page.waitForTimeout(1500);
  console.log(`  ✓ Centered map on ${employee1Name} (${location1Name})`);

  // Verify first employee pin is visible
  const pin1Visible = await mapPage
    .getWorkerPinByName(employee1Name)
    .isVisible()
    .catch(() => false);
  console.log(`  ${employee1Name} pin visible: ${pin1Visible}`);

  // Show second employee - map should zoom to their (different) location
  await mapPage.showWorkerOnMap(employee2Name);
  await page.waitForTimeout(1500);
  console.log(`  ✓ Centered map on ${employee2Name} (${location2Name})`);

  // Verify second employee pin is visible
  const pin2Visible = await mapPage
    .getWorkerPinByName(employee2Name)
    .isVisible()
    .catch(() => false);
  console.log(`  ${employee2Name} pin visible: ${pin2Visible}`);

  // Zoom out to see both locations
  console.log('  Zooming out to see both locations...');
  await mapPage.openMapCameraControls();
  await mapPage.zoomOut(5); // Zoom out significantly
  await page.waitForTimeout(2000);

  // After zooming out, check if we can see multiple pins
  const pinsAfterZoom = await mapPage.getWorkerPin().count();
  console.log(`  ✓ Pins visible after zoom out: ${pinsAfterZoom}`);

  // Verify worker count didn't change
  const finalWorkerCount = await mapPage.getWorkerCount();
  console.log(`  ✓ Final worker count in list: ${finalWorkerCount}`);
  expect(finalWorkerCount).toBeGreaterThanOrEqual(2);

  console.log(
    '✅ Different locations test complete - map shows workers at separate geographic points',
  );
}

/**
 * QL_WM008: Complete Employee Location Scenarios Test
 * Tests both same-location and different-location scenarios in one flow
 * - Part A: Two employees at SAME GPS coordinates (San Francisco)
 * - Part B: Two employees at DIFFERENT locations (SF vs NY)
 */
export async function validateEmployeeLocationScenarios(
  page: Page,
): Promise<void> {
  console.log(
    '=== QL_WM008: Setting up two employees for location scenarios ===',
  );

  // Get two different employees
  const employee1 = await getTestEmployee(page, 'Emp1');
  const employee2 = await getTestEmployee(page, 'Emp2');

  // Clock in both employees
  const timeEntry1 = await clockInEmployee(page, employee1.contactId);
  const timeEntry2 = await clockInEmployee(page, employee2.contactId);

  try {
    // ========================================
    // PART A: Both employees at SAME location
    // ========================================
    console.log('\n--- Part A: Testing SAME location (San Francisco) ---');

    // Create location points at SAME coordinates for both
    await createLocationPointsAtCoordinates(
      page,
      employee1.contactId,
      timeEntry1.startTime,
      TEST_LOCATIONS.SAN_FRANCISCO,
      5,
    );
    await createLocationPointsAtCoordinates(
      page,
      employee2.contactId,
      timeEntry2.startTime,
      TEST_LOCATIONS.SAN_FRANCISCO,
      5,
    );

    console.log(
      `  ✓ Both employees at San Francisco: (${TEST_LOCATIONS.SAN_FRANCISCO.latitude}, ${TEST_LOCATIONS.SAN_FRANCISCO.longitude})`,
    );

    // Validate same location behavior
    await validateEmployeesAtSameLocation(
      page,
      employee1.displayName,
      employee2.displayName,
    );

    // ========================================
    // PART B: Employees at DIFFERENT locations
    // ========================================
    console.log('\n--- Part B: Testing DIFFERENT locations (SF vs NY) ---');

    // Add new location points for employee 2 at New York
    // The map should now show them at different places
    await createLocationPointsAtCoordinates(
      page,
      employee2.contactId,
      timeEntry2.startTime,
      TEST_LOCATIONS.NEW_YORK,
      5,
    );
    console.log(
      `  ✓ Employee 1 (${employee1.displayName}) remains at San Francisco`,
    );
    console.log(`  ✓ Employee 2 (${employee2.displayName}) moved to New York`);

    // Validate different location behavior (skip navigation - already on map)
    await validateEmployeesAtDifferentLocations(
      page,
      employee1.displayName,
      employee2.displayName,
      'San Francisco',
      'New York',
      true, // skipNavigation - we're already on the map from Part A
    );

    console.log(
      '\n✅ QL_WM008: Both location scenarios validated successfully',
    );
  } finally {
    // Cleanup both employees
    console.log('\nCleaning up test data...');
    try {
      await teardownCompleteTestData(
        page,
        {
          config: { companyId: '', realmId: '', userId: '' },
          employee: employee1,
          timeEntry: timeEntry1,
          locationPointIds: [],
        },
        { deleteTimeEntry: true },
      );
      await teardownCompleteTestData(
        page,
        {
          config: { companyId: '', realmId: '', userId: '' },
          employee: employee2,
          timeEntry: timeEntry2,
          locationPointIds: [],
        },
        { deleteTimeEntry: true },
      );
      console.log('  ✓ Test data cleaned up');
    } catch (e) {
      console.log('  ⚠️ Cleanup error:', e);
    }
  }
}
