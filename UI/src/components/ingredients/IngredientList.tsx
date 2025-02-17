import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  initDB,
  saveFavorite,
  removeFavorite,
  getFavorites,
  getIngredients,
} from '@/utils/indexedDB';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { IngredientDetail } from './IngredientDetail';
import { IngredientSearch } from './IngredientSearch';
import { IngredientCard } from './IngredientCard';
import { IngredientSkeleton } from './IngredientSkeleton';
import type { Ingredient } from '@/types/ingredients';
import { FilterSort } from './FilterSort';
import type { IngredientStatus } from '@/types/ingredients';
import { useIngredients } from '@/services/ingredientService';

interface IngredientListProps {
  showOnlyFavorites?: boolean;
}

const mockIngredients: Ingredient[] = [
  {
    id: '1',
    name: 'Rice',
    status: 'safe',
    description: 'Plain rice is generally safe for celiac consumption.',
    category: 'grain',
    tags: ['staple', 'gluten-free'],
    lastUpdated: '2024-03-15',
    scientificName: 'Oryza sativa',
  },
  {
    id: '2',
    name: 'Barley',
    status: 'risk',
    description: 'Contains gluten, unsafe for celiac consumption.',
    category: 'grain',
    tags: ['contains-gluten'],
    lastUpdated: '2024-03-15',
    scientificName: 'Hordeum vulgare',
  },
  {
    id: '3',
    name: 'Oats',
    status: 'risky',
    description: 'May be contaminated with gluten during processing.',
    category: 'grain',
    tags: ['cross-contamination'],
    lastUpdated: '2024-03-15',
    scientificName: 'Avena sativa',
  },
  {
    id: '4',
    name: 'Quinoa',
    status: 'safe',
    description: 'Naturally gluten-free grain.',
    category: 'grain',
    tags: ['ancient-grain', 'gluten-free'],
    lastUpdated: '2024-03-15',
    scientificName: 'Chenopodium quinoa',
  },
  {
    id: '5',
    name: 'Modified Food Starch',
    status: 'unknown',
    description: 'Source needs to be verified.',
    category: 'additive',
    tags: ['additive', 'processed'],
    lastUpdated: '2024-03-15',
  },
];

const IngredientList = ({ showOnlyFavorites = false }: IngredientListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<
    IngredientStatus | 'all'
  >('all');
  const [sortOrder, setSortOrder] = useState<'name' | 'status'>('name');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyFavoritesState, setShowOnlyFavoritesState] =
    useState(showOnlyFavorites);
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const {
    ingredients: fetchedIngredients,
    isLoading: isLoadingIngredients,
    error: fetchError,
  } = useIngredients();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        const savedFavorites = await getFavorites();
        setFavorites(savedFavorites);
      } catch (err) {
        setError('Failed to load favorites. Please refresh the page.');
        console.error('Error initializing:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (fetchedIngredients) {
      setIngredients(fetchedIngredients);
    }
  }, [fetchedIngredients]);

  const toggleFavorite = useCallback(
    async (ingredient: Ingredient) => {
      try {
        if (favorites.includes(ingredient.id)) {
          await removeFavorite(ingredient.id);
          setFavorites((prev) => prev.filter((id) => id !== ingredient.id));
          toast({
            title: 'Removed from favorites',
            description: `${ingredient.name} has been removed from your favorites.`,
          });
        } else {
          await saveFavorite(ingredient.id);
          setFavorites((prev) => [...prev, ingredient.id]);
          toast({
            title: 'Added to favorites',
            description: `${ingredient.name} has been added to your favorites.`,
          });
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to update favorites. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [favorites, toast]
  );

  const filteredIngredients = useMemo(() => {
    return ingredients
      .filter((ingredient) => {
        const matchesSearch =
          !debouncedSearch ||
          ingredient.name.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesFavorites =
          !showOnlyFavoritesState || favorites.includes(ingredient.id);
        const matchesStatus =
          selectedStatus === 'all' || ingredient.status === selectedStatus;
        return matchesSearch && matchesFavorites && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'name') {
          return a.name.localeCompare(b.name);
        } else {
          const statusPriority = { safe: 0, risky: 1, unknown: 2, risk: 3 };
          return statusPriority[a.status] - statusPriority[b.status];
        }
      });
  }, [
    ingredients,
    debouncedSearch,
    showOnlyFavoritesState,
    favorites,
    selectedStatus,
    sortOrder,
  ]);

  if (error || fetchError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error ||
            fetchError?.message ||
            'Failed to load data. Please refresh the page.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading || isLoadingIngredients) {
    return <IngredientSkeleton />;
  }

  return (
    <div className="w-full max-w-none space-y-4">
      <IngredientSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showOnlyFavorites={showOnlyFavoritesState}
        onToggleFavorites={() =>
          setShowOnlyFavoritesState(!showOnlyFavoritesState)
        }
      />

      <FilterSort
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
      />

      <div className="w-full space-y-2">
        {filteredIngredients.length === 0 ? (
          <Card className="w-full p-4 text-center text-gray-500">
            {showOnlyFavoritesState
              ? 'No favorite ingredients yet'
              : `No ingredients found matching "${searchTerm}"`}
          </Card>
        ) : (
          filteredIngredients.map((ingredient) => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              isFavorite={favorites.includes(ingredient.id)}
              onToggleFavorite={toggleFavorite}
              onClick={() => setSelectedIngredient(ingredient)}
            />
          ))
        )}
      </div>

      <IngredientDetail
        ingredient={selectedIngredient}
        isOpen={!!selectedIngredient}
        onClose={() => setSelectedIngredient(null)}
        isFavorite={
          selectedIngredient ? favorites.includes(selectedIngredient.id) : false
        }
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};

export default IngredientList;
