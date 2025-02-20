import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface UseOptionsReturn {
  categories: Category[];
  suppliers: Supplier[];
  isLoading: boolean;
  error: Error | null;
}

export function useCategoriesAndSuppliers(): UseOptionsReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchOptions() {
      try {
        setIsLoading(true);
        const [categoriesRes, suppliersRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/suppliers"),
        ]);

        if (!categoriesRes.ok || !suppliersRes.ok) {
          throw new Error("Failed to fetch options");
        }

        const [categoriesData, suppliersData] = await Promise.all([
          categoriesRes.json(),
          suppliersRes.json(),
        ]);

        setCategories(categoriesData);
        setSuppliers(suppliersData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOptions();
  }, []);

  return {
    categories,
    suppliers,
    isLoading,
    error,
  };
}
