"use client";

import { Suspense } from "react";
import { TransactionsClient } from "./transactions-client";
import { TransactionsTableSkeleton } from "@/components/transactions/loading";
import { useLanguage } from "@/components/language/language-provider";
import { useTranslations } from "next-intl";

export default function TransactionsPage() {
  const { language } = useLanguage();
  const transactionsT = useTranslations("transactions");
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{transactionsT("title")}</h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "تتبع المشتريات والمبيعات" : "Track purchases and sales"}
          </p>
        </div>
      </div>
      
      <Suspense fallback={<TransactionsTableSkeleton />}>
        <TransactionsClient />
      </Suspense>
    </div>
  );
}
