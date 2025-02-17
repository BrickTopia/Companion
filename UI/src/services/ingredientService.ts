import useSWR from 'swr';
import { IngredientsResponse, mapIngredientDTO } from '@/types/ingredientDTO';
import type { Ingredient } from '@/types/ingredients';
import { cacheIngredients, getIngredients as getLocalIngredients } from '@/utils/indexedDB';

const API_URL = 'https://api.sheety.co/e05b4640b9ab192354f836e9a1b60432/ingredients/ingredientsList';

// 12 hours in milliseconds
const SYNC_INTERVAL = 12 * 60 * 60 * 1000;

// Maximum retries for failed fetches
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetcher = async (url: string): Promise<Ingredient[]> => {
  let retries = 0;
  
  // First try to get local data
  try {
    const localData = await getLocalIngredients();
    if (localData && localData.length > 0) {
      return localData;
    }
  } catch (error) {
    console.warn('Failed to get local ingredients:', error);
  }

  // Then try to fetch from API with retries
  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: IngredientsResponse = await response.json();
      
      if (!data?.ingredientsList) {
        throw new Error('Invalid data format received from API');
      }

      const ingredients = data.ingredientsList.map(mapIngredientDTO);
      
      // Cache the ingredients in IndexedDB
      try {
        await cacheIngredients(ingredients);
      } catch (cacheError) {
        console.error('Failed to cache ingredients:', cacheError);
        // Continue even if caching fails
      }
      
      return ingredients;
    } catch (error) {
      retries++;
      console.warn(`Fetch attempt ${retries} failed:`, error);
      
      if (retries === MAX_RETRIES) {
        // On final retry, try to return cached data
        const fallbackData = await getLocalIngredients();
        if (fallbackData && fallbackData.length > 0) {
          console.info('Falling back to cached data');
          return fallbackData;
        }
        throw error;
      }
      
      // Wait before retrying
      await delay(RETRY_DELAY);
    }
  }

  throw new Error('Failed to fetch ingredients after multiple retries');
};

export const useIngredients = () => {
  const { data, error, isLoading, mutate } = useSWR<Ingredient[], Error>(
    API_URL,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: SYNC_INTERVAL, // 12 hours
      errorRetryCount: 2, // Additional SWR-level retries
      errorRetryInterval: 10000, // 10 seconds between SWR retries
      loadingTimeout: 15000, // Show loading state for max 15 seconds
      fallbackData: [], // Provide empty array as fallback
      onError: (error) => {
        console.error('SWR error fetching ingredients:', error);
      }
    }
  );

  return {
    ingredients: data ?? [], // Ensure we always return an array
    isLoading,
    error,
    mutate,
    // Add method to force refresh
    refresh: () => mutate()
  };
}; 