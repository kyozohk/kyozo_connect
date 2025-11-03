/**
 * Utility functions for working with Firebase/Firestore data
 */

/**
 * Serializes Firestore data to ensure Timestamp objects are converted to ISO strings
 * This prevents "Only plain objects can be passed to Client Components from Server Components" errors
 * 
 * @param data Any Firestore data object that might contain Timestamp objects
 * @returns Serialized data with Timestamp objects converted to ISO strings
 */
export function serializeFirestoreData<T>(data: any): T {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    // Convert any Firestore Timestamp objects to ISO strings
    if (value && typeof value === 'object' && value._seconds !== undefined && value._nanoseconds !== undefined) {
      return new Date(value._seconds * 1000).toISOString();
    }
    
    // Handle empty objects that might cause serialization issues
    if (value && typeof value === 'object' && Object.keys(value).length === 0) {
      // If the key is migratedAt, convert empty object to current date ISO string
      if (key === 'migratedAt') {
        return new Date().toISOString();
      }
    }
    
    return value;
  }));
}

/**
 * Checks if an object is a Firestore Timestamp
 * 
 * @param value Any value to check
 * @returns True if the value is a Firestore Timestamp object
 */
export function isFirestoreTimestamp(value: any): boolean {
  return (
    value &&
    typeof value === 'object' &&
    value._seconds !== undefined &&
    value._nanoseconds !== undefined
  );
}

/**
 * Converts a Firestore Timestamp to an ISO string date
 * 
 * @param timestamp Firestore Timestamp object
 * @returns ISO string date
 */
export function timestampToISOString(timestamp: { _seconds: number; _nanoseconds: number }): string {
  return new Date(timestamp._seconds * 1000).toISOString();
}
