
import { useParams } from 'react-router-dom';
import { IngredientDetail } from "@/components/ingredients/IngredientDetail";
import { useState, useEffect } from 'react';
import type { Ingredient } from '@/types/ingredients';

const IngredientDetailPage = () => {
  const { id } = useParams();
  const [ingredient, setIngredient] = useState<Ingredient | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // In a real app, this would be an API call
    // For now, we'll use mock data
    const mockIngredient: Ingredient = {
      id: id || '1',
      name: 'Sample Ingredient',
      status: 'safe',
      description: 'This is a sample ingredient description.',
      category: 'other',
      tags: ['sample'],
      lastUpdated: new Date().toISOString(),
      scientificName: 'Sample scientificus'
    };
    setIngredient(mockIngredient);
  }, [id]);

  const handleToggleFavorite = (ingredient: Ingredient) => {
    setIsFavorite(!isFavorite);
  };

  if (!ingredient) {
    return <div>Loading...</div>;
  }

  return (
    <IngredientDetail
      ingredient={ingredient}
      isOpen={true}
      onClose={() => {}}
      isFavorite={isFavorite}
      onToggleFavorite={handleToggleFavorite}
    />
  );
};

export default IngredientDetailPage;
