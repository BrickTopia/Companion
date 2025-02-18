import { useEffect, useState } from 'react';
import { openDB } from '@/utils/indexedDB';

// Create a promise to track initialization
let dbPromise: Promise<void> | null = null;

const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB().then(() => {
      // Initialization complete
    });
  }
  return dbPromise;
};

export function useIndexedDB() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initDB().catch(err => {
      setError(err instanceof Error ? err : new Error('Failed to initialize database'));
    });
  }, []);

  // Throw the promise for Suspense
  if (!error && dbPromise) {
    throw dbPromise;
  }

  return { error };
} 