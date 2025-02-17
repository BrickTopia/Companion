import { getIngredients as getIngredientsFromDB, cacheIngredients } from '@/utils/indexedDB';
import { createResource } from '@/utils/suspense';
import type { Ingredient } from '@/types/ingredients';
import { mapIngredientDTO } from '@/types/ingredientDTO';
import type { IngredientDTO } from '@/types/ingredientDTO';

const API_URL = 'https://api.sheety.co/e05b4640b9ab192354f836e9a1b60432/ingredients/ingredientsList';

// Create a singleton resource
let ingredientsResource: ReturnType<typeof createResource<Ingredient[]>> | null = null;

const fetchAndCacheIngredients = async (): Promise<Ingredient[]> => {
  try {
    // First try to get from IndexedDB
    const cachedIngredients = await getIngredientsFromDB();
    
    // If we have a network connection, attempt to fetch fresh data
    if (navigator.onLine) {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const freshIngredients = await response.json();
        const ingredientsList = freshIngredients.ingredientsList;
        console.log('ingredientsList', ingredientsList);
        // Ensure we have an array and validate the data
        if (!Array.isArray(ingredientsList)) {
          throw new Error('Invalid data format from API');
        }
        
        // Map the API response using our DTO mapper
        const mappedIngredients = ingredientsList.map((item: IngredientDTO) => mapIngredientDTO(item));
        
        // Cache the mapped ingredients
        await cacheIngredients(mappedIngredients);
        return mappedIngredients;
      } catch (error) {
        console.warn('Failed to fetch fresh ingredients:', error);
        // If we have cached data, use it as fallback
        return Array.isArray(cachedIngredients) ? cachedIngredients : [];
      }
    }
    
    // If offline and we have cached data, use it
    return Array.isArray(cachedIngredients) ? cachedIngredients : [];
  } catch (error) {
    console.error('Error in fetchAndCacheIngredients:', error);
    return []; // Always return an array, even if empty
  }
};

export function useIngredients() {
  if (!ingredientsResource) {
    ingredientsResource = createResource<Ingredient[]>(fetchAndCacheIngredients());
  }
  
  const ingredients = ingredientsResource.read();
  return Array.isArray(ingredients) ? ingredients : [];
}

export async function refreshIngredients() {
  ingredientsResource = createResource<Ingredient[]>(fetchAndCacheIngredients());
  return ingredientsResource.read();
}

interface PeriodicSyncRegistration extends ServiceWorkerRegistration {
  periodicSync: {
    register(tag: string, options: { minInterval: number }): Promise<void>;
  }
}

// Set up periodic sync
export const setupPeriodicSync = async () => {
  if ('serviceWorker' in navigator && 'periodicSync' in navigator.serviceWorker) {
    try {
      const registration = (await navigator.serviceWorker.ready) as PeriodicSyncRegistration;
      await registration.periodicSync.register('sync-ingredients', {
        minInterval: 12 * 60 * 60 * 1000 // 12 hours
      });
    } catch (error) {
      console.warn('Periodic sync registration failed:', error);
    }
  }
};

// Call this in your app initialization
setupPeriodicSync();