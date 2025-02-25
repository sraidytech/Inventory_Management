import { useEffect, useState } from "react";
import { toast } from "sonner";

interface StockAlert {
  productId: string;
  productName: string;
  currentQuantity: number;
  minQuantity: number;
  unit: string;
}

export function useStockAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkStockLevels() {
      try {
        const response = await fetch("/api/products/stock-alerts", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch stock alerts");
        }

        const { alerts: newAlerts = [] } = await response.json();
        setAlerts(newAlerts);

        // Show toast notifications for low stock items
        newAlerts.forEach((alert: StockAlert) => {
          toast.warning(
            `Low stock alert: ${alert.productName} (${alert.currentQuantity} ${alert.unit} remaining)`,
            {
              description: `Minimum quantity: ${alert.minQuantity} ${alert.unit}`,
              duration: 5000,
            }
          );
        });
      } catch (error) {
        console.error("Error checking stock levels:", error);
      } finally {
        setIsLoading(false);
      }
    }

    // Check stock levels immediately and then every 5 minutes
    checkStockLevels();
    const interval = setInterval(checkStockLevels, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    isLoading,
  };
}
