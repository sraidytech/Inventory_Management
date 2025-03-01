"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function DebugPaymentsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generateSamplePayments = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/debug/payments", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("Sample payments generated successfully");
        setResult(JSON.stringify(data, null, 2));
      } else {
        toast.error(`Failed to generate sample payments: ${data.error}`);
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error("Error generating sample payments:", error);
      toast.error("An error occurred while generating sample payments");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Debug: Generate Sample Payments</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Sample Payments</CardTitle>
          <CardDescription>
            This will create sample payment records for existing sale transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to generate sample payment records. This will:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Find recent completed sale transactions</li>
              <li>Create 1-3 payment records for each transaction</li>
              <li>Update transaction payment amounts</li>
              <li>Update client balances</li>
            </ul>
            <Button 
              onClick={generateSamplePayments} 
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate Sample Payments"}
            </Button>
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Result:</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                {result}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
