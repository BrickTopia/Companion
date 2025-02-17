export type IngredientStatus = 'safe' | 'risky' | 'risk' | 'unknown';

export type IngredientCategory = 'grain' | 'dairy' | 'protein' | 'additive' | 'other';

export interface Ingredient {
  id: string;
  name: string;
  status: IngredientStatus;
  description: string;
  alternateNames: string[];
  scientificName?: string;
  category: IngredientCategory;
  tags: string[];
  lastUpdated: string;
  history?: {
    date: string;
    change: string;
  }[];
}
