/**
 * Decrypts an encrypted worker ID from URL path parameters
 * This function reverses the encryption applied in navigateToWorkerSettings
 *
 * @param encryptedWorkerId - The encrypted worker ID to decrypt
 * @returns Decrypted worker ID string, or null if decryption fails
 */
export const decryptWorkerId = (encryptedWorkerId: string): string | null => {
  try {
    // Reverse the URL-safe base64 encoding
    // Add padding if needed
    let base64 = encryptedWorkerId.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(atob(base64));
  } catch (error) {
    // Return null for error handling - error is logged by calling code (Widget.tsx)
    return null;
  }
};
