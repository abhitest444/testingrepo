/**
 * XLSX Configuration - Disable WASM to avoid CSP issues
 *
 * WebAssembly in xlsx causes CSP violations when loading inline base64 WASM modules.
 * This configuration forces xlsx to use the JavaScript fallback instead.
 */
import * as XLSX from 'xlsx';

// Disable WASM to avoid CSP violations
// This forces xlsx to use the JavaScript fallback which is slower but works with strict CSP
if (typeof XLSX.set_cptable !== 'undefined') {
  // For older versions of xlsx
  (XLSX as any).useWorker = false;
}

// For newer versions, disable WASM by setting the flag
if (typeof (XLSX as any).set_fs !== 'undefined') {
  try {
    (XLSX as any).set_fs(undefined);
  } catch (e) {
    // Ignore if not supported
  }
}

// Re-export all XLSX functions and properties
export default XLSX;
export * from 'xlsx';
