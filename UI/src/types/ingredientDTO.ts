import type { Ingredient } from '@/types/ingredients';

// Raw DTO from API
export interface IngredientDTO {
  key: string;
  status: string;
  description: string;
  id: number;
  "alternateNames/0"?: string;
  "alternateNames/1"?: string;
  "alternateNames/2"?: string;
  "alternateNames/3"?: string;
  "aliases/0"?: string;
  "aliases/1"?: string;
  "aliases/2"?: string;
  "aliases/3"?: string;
  "aliases/4"?: string;
}

// Response from API
export interface IngredientsResponse {
  ingredientsList: IngredientDTO[];
}

// Map status from API to our internal status
const mapStatus = (status: string): 'safe' | 'risk' | 'risky' | 'unknown' => {
  switch (status.toUpperCase()) {
    case 'ALLOWED':
      return 'safe';
    case 'NOT ALLOWED':
      return 'risk';
    case 'CHECK LABEL':
      return 'risky';
    case 'GLUTEN-FREE CLAIM':
      return 'safe';
    default:
      return 'unknown';
  }
};

// Map DTO to our internal Ingredient type
export const mapIngredientDTO = (dto: IngredientDTO): Ingredient => {
  // Get all non-empty alternate names and aliases
  const alternateNames = [0, 1, 2, 3]
    .map(i => dto[`alternateNames/${i}` as keyof IngredientDTO])
    .filter((name): name is string => !!name);

  const aliases = [0, 1, 2, 3, 4]
    .map(i => dto[`aliases/${i}` as keyof IngredientDTO])
    .filter((alias): alias is string => !!alias);

  return {
    id: dto.id.toString(),
    name: dto.key.replace(/_/g, ' '),
    status: mapStatus(dto.status),
    description: dto.description,
    alternateNames: [...alternateNames, ...aliases],
    category: 'other', // Default category since API doesn't provide it
    tags: [], // Default empty tags since API doesn't provide them
    lastUpdated: new Date().toISOString(),
    scientificName: undefined // Optional field
  };
}; 