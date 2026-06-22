import { useMemo } from 'react';
import { Search } from 'lucide-react';

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export default function SearchFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
}: SearchFilterBarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="input-field pl-10"
        />
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

export function useFilteredList<T>(
  items: T[],
  search: string,
  searchFields: (item: T) => string[],
  filters?: { field: (item: T) => string; value: string }[],
) {
  return useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        searchFields(item).some((field) =>
          field.toLowerCase().includes(search.toLowerCase()),
        );

      const matchesFilters =
        !filters ||
        filters.every((f) => !f.value || f.field(item) === f.value);

      return matchesSearch && matchesFilters;
    });
  }, [items, search, searchFields, filters]);
}
