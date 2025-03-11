"use client";

import { Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpensesTableSkeleton, ExpenseCategoriesTableSkeleton } from "@/components/expenses/loading";
import { TranslatedText } from "@/components/language/translated-text";
import { ExpensesClient } from "./expenses-client";
import { ExpenseCategoriesClient } from "./expense-categories-client";

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState("expenses");
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            <TranslatedText namespace="expenses" id="title" />
          </h1>
          <p className="text-muted-foreground">
            <TranslatedText namespace="expenses" id="description" />
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="expenses">
            <TranslatedText namespace="expenses" id="title" />
          </TabsTrigger>
          <TabsTrigger value="categories">
            <TranslatedText namespace="expenses" id="categories.title" />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="mt-6">
          <Suspense fallback={<ExpensesTableSkeleton />}>
            <ExpensesClient />
          </Suspense>
        </TabsContent>
        <TabsContent value="categories" className="mt-6">
          <Suspense fallback={<ExpenseCategoriesTableSkeleton />}>
            <ExpenseCategoriesClient />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
