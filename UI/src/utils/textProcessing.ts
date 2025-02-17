import type { Ingredient } from '@/types/ingredients';

interface CommonMistake {
  pattern: RegExp;
  correction: string;
}

// Common OCR mistakes in ingredients
const OCR_MISTAKES: CommonMistake[] = [
  // Spaces and Formatting
  { pattern: /\s+/g, correction: ' ' },                    // Multiple spaces
  { pattern: /,\s*,/g, correction: ',' },                 // Double commas
  { pattern: /\(\s+/g, correction: '(' },                 // Space after opening parenthesis
  { pattern: /\s+\)/g, correction: ')' },                 // Space before closing parenthesis
  
  // Common Character Mistakes
  { pattern: /[;]/g, correction: ',' },                   // Semicolon to comma
  { pattern: /0/g, correction: 'O' },                     // Zero to O
  { pattern: /1/g, correction: 'I' },                     // One to I
  { pattern: /\$/g, correction: 'S' },                    // Dollar to S
  { pattern: /[`']/g, correction: '' },                   // Remove quotes
  
  // Common Word Mistakes
  { pattern: /MGREDIENTS/i, correction: 'INGREDIENTS' },  // Missing I
  { pattern: /CONTAINIS/i, correction: 'CONTAINS' },      // Misspelled CONTAINS
  { pattern: /ALLERGENS?/i, correction: 'ALLERGENS' },    // Normalize ALLERGENS
  
  // Parentheses Fixes
  { pattern: /\(([^)]+$)/g, correction: '($1)' },        // Add missing closing parenthesis
  { pattern: /([^(]+)\)/g, correction: '($1)' },         // Add missing opening parenthesis
  
  // Number and Unit Fixes
  { pattern: /(\d+)\s*%/g, correction: '$1%' },          // Remove space before %
  { pattern: /(\d+)\s*\./g, correction: '$1.' },         // Fix decimal point spacing
  
  // Common ingredients-specific patterns
  { pattern: /\bENRICHED\s+([A-Z])/g, correction: 'ENRICHED $1' },
  { pattern: /\bCONTAINS:?\s*/g, correction: 'CONTAINS: ' },
  { pattern: /\bINGREDIENTS:?\s*/g, correction: 'INGREDIENTS: ' },
  { pattern: /\bMAY CONTAIN\s*/g, correction: 'MAY CONTAIN ' },
  { pattern: /\[([^\]]+)\]/g, correction: '($1)' }, // Convert brackets to parentheses
  { pattern: /(\w)\(/, correction: '$1 (' }, // Add space before parentheses
  { pattern: /\b(AND|&)\b/g, correction: ',' }, // Convert "and" or "&" to comma
  { pattern: /([a-z])([A-Z])/g, correction: '$1, $2' }, // Add comma between words if missing
  
  // Fix common ingredient terms
  { pattern: /FLOUR\s+WHEAT/g, correction: 'WHEAT FLOUR' },
  { pattern: /DEGERMEO/g, correction: 'DEGERMED' },
  { pattern: /CORNMEAL/g, correction: 'CORN MEAL' },
  { pattern: /SOYBFAN/g, correction: 'SOYBEAN' },
  { pattern: /PYROPHOSPHATE/g, correction: 'PYROPHOSPHATE' },
];

// Common ingredient word parts to help with validation
const COMMON_INGREDIENTS_PARTS = [
  'ACID', 'EXTRACT', 'POWDER', 'OIL', 'FLOUR', 'SUGAR', 
  'VITAMIN', 'SODIUM', 'CALCIUM', 'NATURAL', 'ARTIFICIAL',
  'COLOR', 'FLAVOUR', 'FLAVOR', 'MODIFIED', 'PRESERVATIVE',
  'CONCENTRATE', 'PROTEIN', 'SYRUP', 'STARCH', 'CULTURE'
];

// Get ingredients from DB for matching
let ingredientDB: Ingredient[] = [];
const ingredientPatterns: Map<string, RegExp> = new Map();

// Initialize ingredient patterns
export function initializeIngredientMatchers(ingredients: Ingredient[]) {
  ingredientDB = ingredients;
  
  // Build sophisticated patterns for each ingredient and its aliases
  ingredientDB.forEach(ingredient => {
    const patterns = [ingredient.name, ...(ingredient.aliases || [])].map(name => {
      // Create fuzzy pattern that handles:
      // - OCR mistakes (0/O, 1/I)
      // - Spaces and hyphens
      // - Common prefix/suffix variations
      return name
        .replace(/O/g, '[0O]')
        .replace(/I/g, '[1I]')
        .replace(/\s+/g, '\\s*-?\\s*')
        .replace(/A/g, '[A4]');
    });

    // Store compiled pattern for this ingredient
    ingredientPatterns.set(
      ingredient.name,
      new RegExp(`\\b(${patterns.join('|')})\\b`, 'i')
    );
  });
}

/**
 * Clean and normalize ingredient text
 */
export function cleanIngredientText(text: string): string {
  // Convert to uppercase for consistent processing
  let cleaned = text.trim().toUpperCase();

  // Apply all OCR mistake corrections
  OCR_MISTAKES.forEach(({ pattern, correction }) => {
    cleaned = cleaned.replace(pattern, correction);
  });

  // Fix common formatting issues
  cleaned = cleaned
    .replace(/\s*,\s*/g, ', ')           // Normalize comma spacing
    .replace(/^[,\s]+|[,\s]+$/g, '')     // Remove leading/trailing commas and spaces
    .replace(/\s*\(\s*/g, ' (')          // Normalize parenthesis spacing
    .replace(/\s*\)/g, ')')              // Normalize closing parenthesis
    .replace(/\[\d+\]/g, '');            // Remove reference numbers

  return cleaned;
}

/**
 * Find best matching ingredient from our database
 */
function findBestMatch(text: string): string {
  let bestMatch = text;
  let maxScore = 0;

  ingredientPatterns.forEach((pattern, ingredientName) => {
    if (pattern.test(text)) {
      const score = calculateMatchScore(text, ingredientName);
      if (score > maxScore) {
        maxScore = score;
        bestMatch = ingredientName;
      }
    }
  });

  return bestMatch;
}

/**
 * Calculate how well the text matches an ingredient name
 */
function calculateMatchScore(text: string, ingredient: string): number {
  const textNorm = text.toUpperCase();
  const ingredientNorm = ingredient.toUpperCase();
  
  // Direct match gets highest score
  if (textNorm === ingredientNorm) return 1.0;
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(textNorm, ingredientNorm);
  const lengthDiff = Math.abs(textNorm.length - ingredientNorm.length);
  
  // Score based on string similarity and length difference
  return 1 - (distance / Math.max(textNorm.length, ingredientNorm.length)) 
         - (lengthDiff * 0.1);
}

/**
 * Enhanced ingredient validation using DB
 */
export function validateIngredient(ingredient: string): string {
  const cleaned = cleanIngredientText(ingredient);
  return findBestMatch(cleaned);
}

/**
 * Enhanced parseIngredients function
 */
export function parseIngredients(text: string): string[] {
  // First clean the overall text
   const cleaned = cleanIngredientText(text);

  // Extract ingredients section
  const ingredientsMatch = cleaned.match(/INGREDIENTS:?\s*(.*?)(?=(?:\.|CONTAINS:|ALLERGENS:|$))/i);
  const ingredientsText = ingredientsMatch ? ingredientsMatch[1].trim() : cleaned;

  // Handle parenthetical information
  const withParens = ingredientsText.replace(/\(([^)]+)\)/g, (match, p1) => {
    // Keep parenthetical info but ensure proper formatting
    return ` (${p1.trim()})`;
  });

  // Split by commas and clean each ingredient
  return withParens
    .split(/,(?![^(]*\))/)
    .map(ingredient => ingredient.trim())
    .filter(Boolean)
    .map(ingredient => validateIngredient(cleanIngredientText(ingredient)));
}

/**
 * Check if text appears to be an ingredients list
 */
export function isIngrediientsList(text: string): boolean {
  const cleaned = text.trim().toUpperCase();
  
  // Check for common indicators
  if (cleaned.includes('INGREDIENTS:') || 
      cleaned.includes('CONTAINS:') ||
      cleaned.includes('ALLERGENS:')) {
    return true;
  }

  // Check for comma-separated format
  const commaCount = (cleaned.match(/,/g) || []).length;
  const words = cleaned.split(/\s+/).length;
  
  // If there are multiple commas and words, it's likely an ingredients list
  return commaCount > 2 && words > 4 && (commaCount / words) > 0.15;
}

// Helper: Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => 
    Array(a.length + 1).fill(null)
  );

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
} 