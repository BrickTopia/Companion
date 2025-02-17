import type { Ingredient } from '@/types/ingredients';

const DB_NAME = 'celiacSafeDB';
const DB_VERSION = 2;

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve();
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Favorites store
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }

      // Ingredients store with indexes
      if (!db.objectStoreNames.contains('ingredients')) {
        const ingredientStore = db.createObjectStore('ingredients', { keyPath: 'id' });
        ingredientStore.createIndex('lastUpdated', 'lastUpdated');
        ingredientStore.createIndex('status', 'status');
      }
    };
  });
};

export const saveFavorite = async (ingredientId: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction('favorites', 'readwrite');
  const store = transaction.objectStore('favorites');
  
  return new Promise((resolve, reject) => {
    const request = store.put({ id: ingredientId, timestamp: Date.now() });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save favorite'));
  });
};

export const removeFavorite = async (ingredientId: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction('favorites', 'readwrite');
  const store = transaction.objectStore('favorites');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(ingredientId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to remove favorite'));
  });
};

export const getFavorites = async (): Promise<string[]> => {
  const db = await openDB();
  const transaction = db.transaction('favorites', 'readonly');
  const store = transaction.objectStore('favorites');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      const favorites = request.result;
      const syncEnabled = localStorage.getItem("syncEnabled") === "true";
      const cachePolicy = localStorage.getItem("cachePolicy") || "normal";
      
      if (syncEnabled) {
        // Apply cache policy
        const now = Date.now();
        let cacheDuration: number;

        if (cachePolicy === "custom") {
          const customDays = parseInt(localStorage.getItem("customCacheDuration") || "30");
          cacheDuration = customDays * 24 * 60 * 60 * 1000;
        } else {
          cacheDuration = {
            minimal: 7 * 24 * 60 * 60 * 1000, // 7 days
            normal: 30 * 24 * 60 * 60 * 1000, // 30 days
            aggressive: 90 * 24 * 60 * 60 * 1000 // 90 days
          }[cachePolicy];
        }

        const validFavorites = favorites.filter(fav => {
          const age = now - fav.timestamp;
          return age < cacheDuration;
        });

        resolve(validFavorites.map(item => item.id));
      } else {
        resolve(favorites.map(item => item.id));
      }
    };
    request.onerror = () => reject(new Error('Failed to get favorites'));
  });
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to open database'));
  });
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
  if (!ingredients?.length) {
    console.warn('No ingredients to cache');
    return;
  }

  try {
    const db = await openDB();
    const transaction = db.transaction('ingredients', 'readwrite');
    const store = transaction.objectStore('ingredients');
    
    await Promise.all(
      ingredients.map(ingredient => 
        new Promise<void>((resolve, reject) => {
          const request = store.put({
            ...ingredient,
            lastSynced: Date.now()
          });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(new Error(`Failed to cache ingredient: ${ingredient.id}`));
        })
      )
    );
  } catch (error) {
    console.error('Error caching ingredients:', error);
    throw error;
  }
};

// Get ingredients with optional sync check
export const getIngredients = async (forceSync = false): Promise<Ingredient[]> => {
  const db = await openDB();
  const transaction = db.transaction('ingredients', 'readonly');
  const store = transaction.objectStore('ingredients');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      const ingredients = request.result;
      resolve(ingredients);
    };
    
    request.onerror = () => reject(new Error('Failed to get ingredients from IndexedDB'));
  });
};
