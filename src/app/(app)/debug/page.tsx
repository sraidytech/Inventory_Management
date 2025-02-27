"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPage() {
  interface ApiResponse {
    responseStructure: {
      keys: string[];
      hasProducts?: boolean;
      productsIsArray?: boolean;
      productsLength?: number;
      sampleProduct?: Record<string, unknown> | null;
      hasClients?: boolean;
      clientsIsArray?: boolean;
      clientsLength?: number;
      sampleClient?: Record<string, unknown> | null;
    };
    rawResponse: Record<string, unknown>;
  }

  const [productsData, setProductsData] = useState<ApiResponse | null>(null);
  const [clientsData, setClientsData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<{
    products: boolean;
    clients: boolean;
  }>({
    products: false,
    clients: false,
  });

  const fetchProducts = async () => {
    setLoading((prev) => ({ ...prev, products: true }));
    try {
      const response = await fetch("/api/debug/products");
      const data = await response.json();
      setProductsData(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading((prev) => ({ ...prev, products: false }));
    }
  };

  const fetchClients = async () => {
    setLoading((prev) => ({ ...prev, clients: true }));
    try {
      const response = await fetch("/api/debug/clients");
      const data = await response.json();
      setClientsData(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading((prev) => ({ ...prev, clients: false }));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">API Debug Page</h1>
      <p className="text-muted-foreground">
        Use this page to debug API responses and verify data structures.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products Debug */}
        <Card>
          <CardHeader>
            <CardTitle>Products API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={fetchProducts}
              disabled={loading.products}
            >
              {loading.products ? "Loading..." : "Fetch Products"}
            </Button>

            {productsData && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Response Structure:</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                  {JSON.stringify(productsData.responseStructure, null, 2)}
                </pre>

                <h3 className="text-lg font-medium mt-4 mb-2">Raw Response:</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                  {JSON.stringify(productsData.rawResponse, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clients Debug */}
        <Card>
          <CardHeader>
            <CardTitle>Clients API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={fetchClients}
              disabled={loading.clients}
            >
              {loading.clients ? "Loading..." : "Fetch Clients"}
            </Button>

            {clientsData && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Response Structure:</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                  {JSON.stringify(clientsData.responseStructure, null, 2)}
                </pre>

                <h3 className="text-lg font-medium mt-4 mb-2">Raw Response:</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                  {JSON.stringify(clientsData.rawResponse, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
