
export type IngredientStatus = 'safe' | 'risky' | 'risk' | 'unknown';

export type IngredientCategory = 'grain' | 'dairy' | 'protein' | 'additive' | 'other';

export type Ingredient = {
  id: string;
  name: string;
  status: IngredientStatus;
  description: string;
  scientificName?: string;
  category: IngredientCategory;
  tags: string[];
  lastUpdated: string;
  history?: {
    date: string;
    change: string;
  }[];
};
