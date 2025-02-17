import { getIngredients as getIngredientsFromDB } from '@/utils/indexedDB';
import { createResource } from '@/utils/suspense';
import type { Ingredient } from '@/types/ingredients';

// Create a singleton resource
let ingredientsResource: ReturnType<typeof createResource<Ingredient[]>> | null = null;

export function useIngredients() {
  if (!ingredientsResource) {
    ingredientsResource = createResource<Ingredient[]>(
      new Promise((resolve) => {
        setTimeout(async () => {
          const ingredients = await getIngredientsFromDB();
          resolve(ingredients);
        }, 2000);
      })
    );
  }
  
  return ingredientsResource.read();
}