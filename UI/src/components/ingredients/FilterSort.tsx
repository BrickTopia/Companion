
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Filter } from "lucide-react";
import type { IngredientStatus } from "@/types/ingredients";

interface FilterSortProps {
  selectedStatus: IngredientStatus | 'all';
  onStatusChange: (status: IngredientStatus | 'all') => void;
  sortOrder: 'name' | 'status';
  onSortChange: (order: 'name' | 'status') => void;
}

export const FilterSort = ({
  selectedStatus,
  onStatusChange,
  sortOrder,
  onSortChange,
}: FilterSortProps) => {
  return (
    <div className="flex space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={selectedStatus} onValueChange={(value: IngredientStatus | 'all') => onStatusChange(value)}>
            <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="safe">Safe</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="risky">Risky</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="risk">Risk</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="unknown">Unknown</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sortOrder} onValueChange={(value: 'name' | 'status') => onSortChange(value)}>
            <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
