import type { Ingredient } from '@/types/ingredients';
import type { ScannedLabel } from '@/types/scannedLabel';

const DB_NAME = 'celiacSafeDB';
const DB_VERSION = 3;
const SCANNED_LABELS_STORE = 'scannedLabels';
const PENDING_SAVES_STORE = 'pendingSaves';

let dbInstance: IDBDatabase | null = null;

const openDB = async (): Promise<IDBDatabase> => {
  // Return existing connection if available
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('Failed to open database:', request.error);
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      
      // Handle connection closing
      dbInstance.onclose = () => {
        dbInstance = null;
      };

      // Verify all required stores exist
      const storeNames = ['ingredients', 'favorites', SCANNED_LABELS_STORE, PENDING_SAVES_STORE];
      const missingStores = storeNames.filter(store => !dbInstance?.objectStoreNames.contains(store));
      
      if (missingStores.length > 0) {
        console.warn('Missing stores detected:', missingStores);
        // Force a version upgrade by closing and reopening with incremented version
        dbInstance.close();
        dbInstance = null;
        // Recursive call to try again
        resolve(openDB());
        return;
      }
      
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('favorites')) {
        console.log('Creating favorites store');
        db.createObjectStore('favorites', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('ingredients')) {
        console.log('Creating ingredients store');
        const ingredientStore = db.createObjectStore('ingredients', { keyPath: 'id' });
        ingredientStore.createIndex('lastUpdated', 'lastUpdated');
        ingredientStore.createIndex('status', 'status');
      }

      if (!db.objectStoreNames.contains(SCANNED_LABELS_STORE)) {
        console.log('Creating scanned labels store');
        db.createObjectStore(SCANNED_LABELS_STORE, {
          keyPath: 'id',
          autoIncrement: false,
        });
      }

      if (!db.objectStoreNames.contains(PENDING_SAVES_STORE)) {
        console.log('Creating pending saves store');
        db.createObjectStore(PENDING_SAVES_STORE, {
          keyPath: 'id',
          autoIncrement: false,
        });
      }
    };
  });
};

export const saveFavorite = async (ingredientId: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('favorites', 'readwrite');
    const store = transaction.objectStore('favorites');
    
    return new Promise((resolve) => {
      const request = store.put({ id: ingredientId, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn('Failed to save favorite');
        resolve();
      };
    });
  } catch (error) {
    console.warn('Error in saveFavorite:', error);
  }
};

export const removeFavorite = async (ingredientId: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('favorites', 'readwrite');
    const store = transaction.objectStore('favorites');
    
    return new Promise((resolve) => {
      const request = store.delete(ingredientId);
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn('Failed to remove favorite');
        resolve();
      };
    });
  } catch (error) {
    console.warn('Error in removeFavorite:', error);
  }
};

export const getFavorites = async (): Promise<string[]> => {
  try {
    const db = await openDB();
    
    // Verify store exists before attempting transaction
    if (!db.objectStoreNames.contains('favorites')) {
      console.warn('Favorites store not found, returning empty array');
      return [];
    }
    
    const transaction = db.transaction('favorites', 'readonly');
    const store = transaction.objectStore('favorites');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const favorites = request.result || [];
        const syncEnabled = localStorage.getItem("syncEnabled") === "true";
        const cachePolicy = localStorage.getItem("cachePolicy") || "normal";
        
        if (syncEnabled) {
          const now = Date.now();
          let cacheDuration: number;

          if (cachePolicy === "custom") {
            const customDays = parseInt(localStorage.getItem("customCacheDuration") || "30");
            cacheDuration = customDays * 24 * 60 * 60 * 1000;
          } else {
            cacheDuration = {
              minimal: 7 * 24 * 60 * 60 * 1000,
              normal: 30 * 24 * 60 * 60 * 1000,
              aggressive: 90 * 24 * 60 * 60 * 1000
            }[cachePolicy];
          }

          const validFavorites = favorites.filter(fav => {
            const age = now - (fav?.timestamp || 0);
            return age < cacheDuration;
          });

          resolve(validFavorites.map(item => item?.id || '').filter(Boolean));
        } else {
          resolve(favorites.map(item => item?.id || '').filter(Boolean));
        }
      };
      request.onerror = () => {
        console.warn('Failed to get favorites, returning empty array');
        resolve([]);
      };
    });
  } catch (error) {
    console.warn('Error in getFavorites:', error);
    return [];
  }
};

let syncInterval: number | null = null;

export const setupSyncInterval = () => {
  // Clear existing interval if any
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  const syncEnabled = localStorage.getItem("syncEnabled") === "true";
  if (syncEnabled) {
    const intervalMinutes = parseInt(localStorage.getItem("customSyncInterval") || "30");
    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    syncInterval = window.setInterval(() => {
      // Trigger sync here
      getFavorites(); // This will apply the current cache policy
    }, intervalMs);
  }
};

// Call setupSyncInterval when sync settings change
export const initSync = () => {
  setupSyncInterval();
  // Listen for storage changes to update sync interval
  window.addEventListener('storage', (e) => {
    if (e.key === 'syncEnabled' || e.key === 'customSyncInterval') {
      setupSyncInterval();
    }
  });
};

// New function to cache ingredients from API
export const cacheIngredients = async (ingredients: Ingredient[]): Promise<void> => {
  if (!ingredients?.length) return;

  try {
    const db = await openDB();
    
    // Verify store exists before attempting transaction
    if (!db.objectStoreNames.contains('ingredients')) {
      throw new Error('Ingredients store not found');
    }
    
    const transaction = db.transaction('ingredients', 'readwrite');
    const store = transaction.objectStore('ingredients');
    
    return new Promise<void>((resolve, reject) => {
      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };

      // Clear existing data first
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        let completed = 0;
        const errors: Error[] = [];

        ingredients.forEach(ingredient => {
          const request = store.put({
            ...ingredient,
            lastSynced: Date.now()
          });
          
          request.onsuccess = () => {
            completed++;
            if (completed === ingredients.length) {
              if (errors.length > 0) {
                reject(new Error(`Failed to cache ${errors.length} ingredients`));
              } else {
                resolve();
              }
            }
          };
          
          request.onerror = () => {
            console.warn(`Failed to cache ingredient: ${ingredient.id}`, request.error);
            errors.push(request.error || new Error(`Failed to cache ingredient: ${ingredient.id}`));
            completed++;
            if (completed === ingredients.length) {
              reject(new Error(`Failed to cache ${errors.length} ingredients`));
            }
          };
        });
      };
      
      clearRequest.onerror = () => {
        console.error('Failed to clear existing ingredients:', clearRequest.error);
        reject(new Error('Failed to clear existing ingredients'));
      };
    });
  } catch (error) {
    console.error('Error caching ingredients:', error);
    throw error; // Re-throw to handle in calling code
  }
};

// Get ingredients with optional sync check
export const getIngredients = async (forceSync = false): Promise<Ingredient[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction('ingredients', 'readonly');
    const store = transaction.objectStore('ingredients');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const ingredients = request.result || [];
        resolve(ingredients);
      };
      
      request.onerror = () => {
        console.warn('Failed to get ingredients from IndexedDB');
        resolve([]);
      };
    });
  } catch (error) {
    console.warn('Error getting ingredients:', error);
    return [];
  }
};

export const saveScannedLabel = async (label: ScannedLabel): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(SCANNED_LABELS_STORE, 'readwrite');
  const store = transaction.objectStore(SCANNED_LABELS_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.put(label);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save label'));
  });
};

export const getScannedLabels = async (): Promise<ScannedLabel[]> => {
  const db = await openDB();
  const transaction = db.transaction(SCANNED_LABELS_STORE, 'readonly');
  const store = transaction.objectStore(SCANNED_LABELS_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get scanned labels'));
  });
};

export const savePendingLabel = async (label: ScannedLabel): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(PENDING_SAVES_STORE, 'readwrite');
  const store = transaction.objectStore(PENDING_SAVES_STORE);
  await store.put({ ...label, timestamp: Date.now() });
};

export const recoverPendingSaves = async (): Promise<ScannedLabel[]> => {
  const db = await openDB();
  const transaction = db.transaction(PENDING_SAVES_STORE, 'readonly');
  const store = transaction.objectStore(PENDING_SAVES_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get pending saves'));
  });
};

export const clearPendingSave = async (id: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(PENDING_SAVES_STORE, 'readwrite');
  const store = transaction.objectStore(PENDING_SAVES_STORE);
  await store.delete(id);
};

// Make openDB available for export
export { openDB };
