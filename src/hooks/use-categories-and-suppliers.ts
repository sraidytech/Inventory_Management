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

        // Check if the response has the expected structure
        if (categoriesData && categoriesData.categories) {
          setCategories(categoriesData.categories);
        } else {
          console.error("Invalid categories data structure:", categoriesData);
          setCategories([]);
        }

        if (suppliersData && suppliersData.suppliers) {
          setSuppliers(suppliersData.suppliers);
        } else {
          console.error("Invalid suppliers data structure:", suppliersData);
          setSuppliers([]);
        }
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
