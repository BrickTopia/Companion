import { IngredientStatus } from '@/types/ingredients';

type StatusConfig = {
  [key in IngredientStatus]: {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
  };
};

export const statusConfig: StatusConfig = {
  safe: {
    label: 'Safe',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: '✓',
  },
  unsafe: {
    label: 'Unsafe',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: '✕',
  },
  caution: {
    label: 'Caution',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    icon: '!',
  },
  unknown: {
    label: 'Unknown',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    icon: '?',
  },
};

export const getStatusColor = (status: IngredientStatus) => statusConfig[status].color;
export const getStatusBgColor = (status: IngredientStatus) => statusConfig[status].bgColor;
export const getStatusLabel = (status: IngredientStatus) => statusConfig[status].label;
export const getStatusIcon = (status: IngredientStatus) => statusConfig[status].icon; 